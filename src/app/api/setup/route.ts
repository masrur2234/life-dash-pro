import { NextResponse } from 'next/server';

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL is not configured. Go to Vercel > Settings > Environment Variables and add DATABASE_URL.',
      }, { status: 500 });
    }

    const { execSync } = await import('child_process');

    execSync('npx prisma db push --accept-data-loss 2>&1', {
      stdio: 'pipe',
      timeout: 60000,
    });

    const { db } = await import('@/lib/db');
    const userCount = await db.user.count();

    return NextResponse.json({
      success: true,
      message: 'Database is ready!',
      tablesCreated: true,
      userCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'Failed to setup database: ' + message,
    }, { status: 500 });
  }
}
