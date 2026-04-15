import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'lifedash-salt-2024').digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured. Set DATABASE_URL in Vercel Environment Variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (action === 'register') {
      const existing = await db.user.findFirst({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      if (password.length < 4) {
        return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
      }

      const hashedPassword = hashPassword(password);
      const user = await db.user.create({
        data: {
          id: randomUUID(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: hashedPassword,
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
    }

    if (action === 'login') {
      const user = await db.user.findFirst({ where: { email: email.trim().toLowerCase() } });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!user.passwordHash) {
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
        });
      }

      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "login" or "register".' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Auth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('relation') || message.includes('table') || message.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database tables not created yet. Please visit /api/setup first, or set DATABASE_URL in Vercel.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Server error: ' + message }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
