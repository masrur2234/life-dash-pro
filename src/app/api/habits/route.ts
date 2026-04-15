import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const habits = await db.habit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(habits);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, id, name, icon } = body;

    // CREATE a new habit
    if (action === 'create') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      const habitCount = await db.habit.count({ where: { userId: user.id } });
      if (habitCount >= 15) {
        return NextResponse.json({ error: 'Maximum 15 habits reached' }, { status: 400 });
      }

      const habit = await db.habit.create({
        data: {
          userId: user.id,
          name: name.trim(),
          icon: icon || '🎯',
          streak: 0,
          completedDays: '[]',
        },
      });

      return NextResponse.json(habit, { status: 201 });
    }

    // UPDATE an existing habit (rename / change icon)
    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 });
      }

      const updateData: Record<string, string> = {};
      if (name !== undefined) updateData.name = name.trim();
      if (icon !== undefined) updateData.icon = icon;

      const habit = await db.habit.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(habit);
    }

    // DELETE a habit
    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 });
      }

      await db.habit.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // TOGGLE habit completion for today (original behavior)
    if (!id) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 });
    }

    const habit = await db.habit.findUnique({ where: { id } });
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const completedDays: string[] = JSON.parse(habit.completedDays);
    const isCompletedToday = completedDays.includes(today);

    let newCompletedDays: string[];
    let newStreak: number;

    if (isCompletedToday) {
      newCompletedDays = completedDays.filter((d: string) => d !== today);
      newStreak = Math.max(0, newCompletedDays.length);
    } else {
      newCompletedDays = [...completedDays, today];
      newStreak = newCompletedDays.length;
    }

    const updated = await db.habit.update({
      where: { id },
      data: {
        completedDays: JSON.stringify(newCompletedDays),
        streak: newStreak,
      },
    });

    // Award XP for completing a habit
    if (!isCompletedToday) {
      await db.user.update({
        where: { id: user.id },
        data: { xp: { increment: 10 } },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process habit' }, { status: 500 });
  }
}
