import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function getCompletedDays(streak: number): string {
  const days: string[] = [];
  for (let i = 0; i < Math.min(streak, 14); i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return JSON.stringify(days);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.note.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.task.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const user = await prisma.user.create({
    data: {
      name: 'Alex',
      email: 'alex@lifedash.pro',
      level: 3,
      xp: 250,
    },
  });

  console.log(`✅ Created user: ${user.name}`);

  // Create transactions (mix of income + expenses)
  const transactions = [
    // Income
    { userId: user.id, amount: 5000000, category: 'Income', description: 'Monthly salary', date: daysAgo(1) },
    { userId: user.id, amount: 750000, category: 'Income', description: 'Freelance project', date: daysAgo(5) },
    { userId: user.id, amount: 200000, category: 'Income', description: 'Investment returns', date: daysAgo(10) },
    { userId: user.id, amount: 350000, category: 'Income', description: 'Side hustle', date: daysAgo(15) },
    { userId: user.id, amount: 150000, category: 'Income', description: 'Cashback rewards', date: daysAgo(20) },

    // Expenses - Food
    { userId: user.id, amount: -45000, category: 'Food', description: 'Grocery shopping', date: daysAgo(0) },
    { userId: user.id, amount: -25000, category: 'Food', description: 'Coffee & lunch', date: daysAgo(1) },
    { userId: user.id, amount: -35000, category: 'Food', description: 'Dinner with friends', date: daysAgo(3) },
    { userId: user.id, amount: -18000, category: 'Food', description: 'Lunch delivery', date: daysAgo(7) },
    { userId: user.id, amount: -40000, category: 'Food', description: 'Weekly groceries', date: daysAgo(12) },
    { userId: user.id, amount: -15000, category: 'Food', description: 'Morning coffee', date: daysAgo(16) },
    { userId: user.id, amount: -42000, category: 'Food', description: 'Restaurant dinner', date: daysAgo(20) },

    // Expenses - Transport
    { userId: user.id, amount: -15000, category: 'Transport', description: 'Uber ride', date: daysAgo(1) },
    { userId: user.id, amount: -20000, category: 'Transport', description: 'Gas station', date: daysAgo(3) },
    { userId: user.id, amount: -22000, category: 'Transport', description: 'Monthly metro pass', date: daysAgo(10) },
    { userId: user.id, amount: -19000, category: 'Transport', description: 'Taxi ride', date: daysAgo(22) },

    // Expenses - Entertainment
    { userId: user.id, amount: -80000, category: 'Entertainment', description: 'Netflix & Spotify', date: daysAgo(2) },
    { userId: user.id, amount: -60000, category: 'Entertainment', description: 'Concert tickets', date: daysAgo(8) },
    { userId: user.id, amount: -28000, category: 'Entertainment', description: 'Movie tickets', date: daysAgo(18) },

    // Expenses - Shopping
    { userId: user.id, amount: -50000, category: 'Shopping', description: 'New headphones', date: daysAgo(5) },
    { userId: user.id, amount: -25000, category: 'Shopping', description: 'Book purchase', date: daysAgo(14) },

    // Expenses - Bills
    { userId: user.id, amount: -30000, category: 'Bills', description: 'Electric bill', date: daysAgo(6) },
    { userId: user.id, amount: -35000, category: 'Bills', description: 'Internet bill', date: daysAgo(15) },
  ];

  for (const t of transactions) {
    await prisma.transaction.create({ data: t });
  }
  console.log(`✅ Created ${transactions.length} transactions (5 income + 21 expenses)`);

  // Create tasks for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tasks = [
    { userId: user.id, title: 'Review monthly budget', completed: true, date: todayStart, order: 0 },
    { userId: user.id, title: 'Prepare presentation slides', completed: false, date: todayStart, order: 1 },
    { userId: user.id, title: 'Evening workout session', completed: false, date: todayStart, order: 2 },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }
  console.log(`✅ Created ${tasks.length} tasks`);

  // Create habits
  const habits = [
    { userId: user.id, name: 'Morning Meditation', icon: '🧘', streak: 7, completedDays: getCompletedDays(7) },
    { userId: user.id, name: 'Read 30 min', icon: '📚', streak: 12, completedDays: getCompletedDays(12) },
    { userId: user.id, name: 'Exercise', icon: '💪', streak: 5, completedDays: getCompletedDays(5) },
    { userId: user.id, name: 'Drink 8 glasses water', icon: '💧', streak: 3, completedDays: getCompletedDays(3) },
  ];

  for (const h of habits) {
    await prisma.habit.create({ data: h });
  }
  console.log(`✅ Created ${habits.length} habits`);

  // Create badges
  const badges = [
    { userId: user.id, badge: 'first_login', earnedAt: daysAgo(20) },
    { userId: user.id, badge: 'streak_7', earnedAt: daysAgo(7) },
    { userId: user.id, badge: 'budget_master', earnedAt: daysAgo(5) },
    { userId: user.id, badge: 'task_completer', earnedAt: daysAgo(3) },
  ];

  for (const b of badges) {
    await prisma.userBadge.create({ data: b });
  }
  console.log(`✅ Created ${badges.length} badges`);

  // Create chat messages
  const chatMessages = [
    { userId: user.id, role: 'assistant', content: "Welcome to LifeDash Pro! I'm your AI life coach. I can help you track spending, build habits, and stay productive. Just tell me what's on your mind!", createdAt: daysAgo(1) },
    { userId: user.id, role: 'user', content: 'I spent 25k on coffee today', createdAt: daysAgo(0) },
    { userId: user.id, role: 'assistant', content: "I've logged that as a Food transaction. That's about 25,000. Your coffee spending has been trending up this month. Would you like me to set a weekly coffee budget alert?", createdAt: daysAgo(0) },
  ];

  for (const m of chatMessages) {
    await prisma.chatMessage.create({ data: m });
  }
  console.log(`✅ Created ${chatMessages.length} chat messages`);

  // Create sample notes
  const notes = [
    {
      userId: user.id,
      title: 'Welcome to LifeDash Notes',
      content: '# Welcome! 👋\n\nThis is your **personal notepad** — like a mini Obsidian right inside LifeDash Pro!\n\n## Features\n\n- **Markdown** support (headers, bold, italic, lists, code)\n- **[[Wiki Links]]** — type `[[` to link to other notes\n- **Tags** — organize with #hashtags\n- **Pin** important notes to the top\n\n## Quick Tips\n\n> Writing things down helps you remember and process your thoughts.\n\nTry creating a new note with the + button!\n\n```\nExample code block\n```',
      tags: JSON.stringify(['getting-started', 'docs']),
      isPinned: true,
    },
    {
      userId: user.id,
      title: 'Weekly Goals',
      content: '# This Week\'s Goals 🎯\n\n## Work\n- [ ] Finish project proposal\n- [x] Review pull requests\n- [ ] Prepare sprint demo\n\n## Personal\n- [ ] Read 2 chapters of current book\n- [x] Morning meditation every day\n- [ ] Try a new recipe\n\n## Finance\n- [ ] Track all expenses\n- [ ] Review subscription costs\n\n---\n\n*Last updated: Today*',
      tags: JSON.stringify(['goals', 'weekly']),
      isPinned: true,
    },
    {
      userId: user.id,
      title: 'Meeting Notes - Project Alpha',
      content: '# Project Alpha - Sync Meeting\n\n**Date:** This week\n**Attendees:** Team leads\n\n## Discussion Points\n\n1. Timeline update — on track for Q2 release\n2. Design review — new mockups shared in Figma\n3. Performance optimization needed for dashboard\n\n## Action Items\n\n- @alex: Review API contracts by Friday\n- @team: Submit weekly status updates\n\n## Links\n\n- [[Weekly Goals]]\n- [[Ideas & Brainstorm]]',
      tags: JSON.stringify(['meetings', 'work']),
      isPinned: false,
    },
    {
      userId: user.id,
      title: 'Ideas & Brainstorm',
      content: '# 💡 Ideas\n\nRandom thoughts and ideas to explore later.\n\n## App Ideas\n- Habit streak visualization with heat map\n- AI-generated daily summaries\n- Voice journaling feature\n\n## Learning\n- Rust programming language\n- System design patterns\n- Advanced TypeScript generics\n\n## Books to Read\n- Atomic Habits\n- Deep Work\n- The Psychology of Money',
      tags: JSON.stringify(['ideas', 'learning']),
      isPinned: false,
    },
    {
      userId: user.id,
      title: 'Daily Journal',
      content: '# 📝 Daily Journal\n\n## Grateful for today\n- Had a productive morning\n- Great conversation with a friend\n- Learned something new\n\n## What went well\n- Completed tasks ahead of schedule\n- Maintained habit streak\n\n## Tomorrow\'s focus\n- Early morning workout\n- Deep work session on project\n\n---\n\n*Remember: Progress, not perfection.*',
      tags: JSON.stringify(['journal', 'personal']),
      isPinned: false,
    },
  ];

  for (const n of notes) {
    await prisma.note.create({ data: n });
  }
  console.log(`✅ Created ${notes.length} notes`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
