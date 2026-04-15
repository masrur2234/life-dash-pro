import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';

// Simple hash function using Node.js crypto
function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'lifedash-salt-2024').digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// POST /api/auth — login or register
export async function POST(request: NextRequest) {
  try {
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
        // Legacy user without password (seeded user) — allow any password
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
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// GET /api/auth — health check
export async function GET() {
  try {
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
