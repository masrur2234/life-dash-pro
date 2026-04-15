import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const notes = await db.note.findMany({
      where: { userId: user.id },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, id, title, content, tags, isPinned } = body;

    // CREATE a new note
    if (action === 'create') {
      if (!title || !title.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      const note = await db.note.create({
        data: {
          userId: user.id,
          title: title.trim(),
          content: content || '',
          tags: tags ? JSON.stringify(tags) : '[]',
        },
      });

      return NextResponse.json(note, { status: 201 });
    }

    // UPDATE an existing note
    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title.trim();
      if (content !== undefined) updateData.content = content;
      if (tags !== undefined) updateData.tags = JSON.stringify(tags);
      if (isPinned !== undefined) updateData.isPinned = isPinned;

      const note = await db.note.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(note);
    }

    // DELETE a note
    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
      }

      await db.note.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process note' }, { status: 500 });
  }
}
