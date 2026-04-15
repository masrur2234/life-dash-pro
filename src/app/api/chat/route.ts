import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        userId: user.id,
        role: 'user',
        content: message,
      },
    });

    // Get recent messages for context
    const recentMessages = await db.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const contextMessages = recentMessages
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    // Get spending context
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const spendingContext = transactions.length > 0
      ? `\nRecent spending: ${transactions.map((t) => `${t.category}: ${t.amount} (${t.description || 'N/A'})`).join(', ')}`
      : '';

    // Try z-ai-web-dev-sdk first (works in dev environment)
    let aiResponse: string;
    try {
      const sdk = await import('z-ai-web-dev-sdk');
      const completion = await sdk.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are "Dash", a friendly AI life coach inside LifeDash Pro app. You help users manage finances, build habits, and stay productive.
Rules:
- Be brief (2-3 sentences max). Use emojis occasionally.
- Be encouraging but honest.
- If they mention spending, acknowledge it and give a brief tip.
- If they ask about productivity, give one actionable suggestion.
- Keep responses short and conversational.
- Respond in the same language the user uses.${spendingContext}`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      aiResponse = completion.choices?.[0]?.message?.content || "I'm here to help! Tell me about your day or recent spending.";
    } catch {
      // Fallback: generate smart response without AI API
      aiResponse = generateLocalResponse(message, spendingContext);
    }

    // Save AI response
    await db.chatMessage.create({
      data: {
        userId: user.id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    // Award XP for chatting
    await db.user.update({
      where: { id: user.id },
      data: { xp: { increment: 5 } },
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const messages = await db.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// Smart local fallback when AI API is not available
function generateLocalResponse(message: string, spendingContext: string): string {
  const lower = message.toLowerCase();

  // Spending-related responses
  if (lower.includes('spend') || lower.includes('beli') || lower.includes('buy') || lower.includes('bayar') || lower.includes('harga') || lower.includes('uang') || lower.includes('spending') || lower.includes('budget') || lower.includes('expense')) {
    const tips = [
      "Nice record! 💰 Tracking expenses is the first step to financial awareness. Keep logging every purchase!",
      "Good job noting that! 📊 Try to categorize your spending — it helps see where your money goes each month.",
      "Every rupiah counts! 💪 Consider setting a daily spending limit to stay within your budget.",
      "That's logged! 🎯 Tip: Review your spending weekly to find patterns you can improve on.",
      "Recorded! 📝 Try the 50/30/20 rule — 50% needs, 30% wants, 20% savings. It's a game changer!",
      "Noted! 💡 Small expenses add up fast. A daily 50k coffee habit = 1.5M per month! ☕",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Habit-related responses
  if (lower.includes('habit') || lower.includes('kebiasaan') || lower.includes('streak') || lower.includes('routine') || lower.includes('rutin')) {
    const tips = [
      "Building habits is about consistency, not perfection! 🌱 Even doing it 60% of the time builds momentum.",
      "Start small! 🎯 Pick ONE habit and do it for just 5 minutes daily. Small wins compound big time!",
      "Don't break the chain! 🔥 Your streak is your superpower. Try to never miss 2 days in a row.",
      "Habit stacking works wonders! 📚 Attach a new habit to something you already do every day.",
      "Track your habits here! ✅ The more you check off, the more XP you earn. Gamification helps! 🎮",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Task/productivity-related responses
  if (lower.includes('task') || lower.includes('todo') || lower.includes('productiv') || lower.includes('fokus') || lower.includes('kerja') || lower.includes('deadline') || lower.includes('stress') || lower.includes('tired') || lower.includes('lelah') || lower.includes('malas') || lower.includes('lazy')) {
    const tips = [
      "Break big tasks into smaller ones! 🧩 A 10-min task feels way easier than a 2-hour project.",
      "Try the Pomodoro technique: 25 min focus, 5 min break. It's simple but powerful! 🍅",
      "Prioritize your top 3 tasks each morning. Focus on those first! 🎯",
      "Take breaks! Your brain needs rest to stay productive. A 10-min walk can boost focus by 50%. 🚶",
      "Done is better than perfect! ✅ Ship it, then improve. Perfectionism kills productivity.",
      "You got this! 💪 Remember why you started. Small progress is still progress!",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Greeting responses
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('halo') || lower.includes('hai') || lower.includes('hey') || lower.includes('pagi') || lower.includes('siang') || lower.includes('malam') || lower.includes('morning') || lower.includes('evening')) {
    const greetings = [
      "Hey there! 👋 I'm Dash, your AI life coach. How can I help you today?",
      "Hello! 😊 Ready to make today count? Tell me what's on your mind!",
      "Hi! 🌟 Great to see you. Track a habit, log spending, or just chat — I'm here!",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Motivational responses
  if (lower.includes('motivat') || lower.includes('semangat') || lower.includes('can i') || lower.includes('bisa') || lower.includes('galau') || lower.includes('sedih') || lower.includes('sad') || lower.includes('down')) {
    const motivations = [
      "You're doing amazing just by being here! 🌟 Progress, not perfection, remember?",
      "Every expert was once a beginner. Keep going! 🔥 Your future self will thank you.",
      "Tough times don't last, but tough people do! 💪 You've got what it takes.",
      "Small steps every day lead to big changes. Trust the process! 🚀",
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  // Default responses
  const defaults = [
    "I hear you! 💬 Try logging your spending or checking off a habit — small actions build big results!",
    "Interesting! 🤔 Tell me more about that. Meanwhile, don't forget to track your habits today!",
    "Thanks for sharing! 🌟 I'm here to help with finances, habits, and productivity. What would you like to work on?",
    "Noted! ✨ Pro tip: Check your spending insights for the week — it might surprise you!",
    "Got it! 🎯 Remember, consistency beats intensity. Keep showing up every day!",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}
