import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tasks = await db.task.findMany({
      where: {
        userId: user.id,
        date: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const body = await request.json();

    // Handle task completion toggle
    if (body.action === 'toggle') {
      const { id, completed } = body;
      const task = await db.task.update({
        where: { id },
        data: { completed },
      });

      // Award XP for completing a task
      if (completed) {
        await db.user.update({
          where: { id: user.id },
          data: { xp: { increment: 15 } },
        });
      }

      return NextResponse.json(task);
    }

    // Handle task deletion
    if (body.action === 'delete') {
      const { id } = body;
      await db.task.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // Handle new task creation
    const { title } = body;
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const existingCount = await db.task.count({
      where: {
        userId: user.id,
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    if (existingCount >= 20) {
      return NextResponse.json({ error: 'Maximum 20 tasks per day' }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const task = await db.task.create({
      data: {
        userId: user.id,
        title,
        date: todayStart,
        order: existingCount,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  }
}
