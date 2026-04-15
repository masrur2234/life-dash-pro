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

    // Use z-ai-web-dev-sdk for AI response
    let aiResponse: string;
    try {
      const sdk = await import('z-ai-web-dev-sdk');
      const completion = await sdk.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a friendly, concise AI life coach named "Dash". You help users manage their finances, build habits, and stay productive. 
Be brief (2-3 sentences max). Use emojis occasionally. Be encouraging but honest.
If they mention spending, acknowledge it and give a brief tip.
If they ask about productivity, give one actionable suggestion.
Keep responses short and conversational.${spendingContext}`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      aiResponse = completion.choices?.[0]?.message?.content || "I'm here to help! Try telling me about your day or recent spending.";
    } catch {
      aiResponse = "I'm processing your request. Try again in a moment! 😊";
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
