import { db, ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/setup — auto-create database tables
export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL is not configured. Go to Vercel > Settings > Environment Variables and add DATABASE_URL with your PostgreSQL connection string.',
      }, { status: 500 });
    }

    await ensureSchema();

    // Verify by counting users
    const userCount = await db.user.count();

    return NextResponse.json({
      success: true,
      message: 'Database is ready!',
      userCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}
