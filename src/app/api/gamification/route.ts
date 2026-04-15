import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Beginner', minXp: 0 },
  { level: 2, name: 'Starter', minXp: 100 },
  { level: 3, name: 'Regular', minXp: 300 },
  { level: 4, name: 'Pro', minXp: 600 },
  { level: 5, name: 'Expert', minXp: 1000 },
  { level: 6, name: 'Discipline King', minXp: 1500 },
];

const BADGE_DEFINITIONS: Record<string, string> = {
  first_login: '🏅 First Steps',
  streak_7: '🔥 7-Day Streak',
  streak_30: '⚡ 30-Day Streak',
  budget_master: '💰 Budget Master',
  task_completer: '✅ Task Hero',
  chat_power: '💬 Chat Power',
  level_3: '🌟 Rising Star',
  level_5: '👑 Elite',
};

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    // Get badges
    const userBadges = await db.userBadge.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: 'desc' },
    });

    // Calculate level
    let currentLevel = LEVEL_THRESHOLDS[0];
    let nextLevel = LEVEL_THRESHOLDS[1];
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (user.xp >= LEVEL_THRESHOLDS[i].minXp) {
        currentLevel = LEVEL_THRESHOLDS[i];
        nextLevel = LEVEL_THRESHOLDS[i + 1] || null;
        break;
      }
    }

    const xpProgress = nextLevel
      ? ((user.xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
      : 100;

    return NextResponse.json({
      user: {
        name: user.name,
        level: currentLevel.level,
        levelName: currentLevel.name,
        xp: user.xp,
        xpToNext: nextLevel ? nextLevel.minXp - user.xp : 0,
        xpProgress: Math.min(xpProgress, 100),
      },
      badges: userBadges.map((b) => ({
        id: b.badge,
        name: BADGE_DEFINITIONS[b.badge] || b.badge,
        earnedAt: b.earnedAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gamification data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const body = await request.json();
    const { xp: xpToAdd, badge: badgeToAward } = body;

    if (xpToAdd) {
      await db.user.update({
        where: { id: user.id },
        data: { xp: { increment: xpToAdd } },
      });
    }

    if (badgeToAward) {
      const existing = await db.userBadge.findFirst({
        where: { userId: user.id, badge: badgeToAward },
      });

      if (!existing) {
        await db.userBadge.create({
          data: { userId: user.id, badge: badgeToAward },
        });
      }
    }

    // Check for level-up and award badges
    const updatedUser = await db.user.findFirst({ where: { id: user.id } });
    if (updatedUser) {
      const earnedBadges = await db.userBadge.findMany({
        where: { userId: user.id },
      });
      const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badge));

      const newBadges: string[] = [];

      if (updatedUser.xp >= 300 && !earnedBadgeIds.has('level_3')) {
        newBadges.push('level_3');
      }
      if (updatedUser.xp >= 1000 && !earnedBadgeIds.has('level_5')) {
        newBadges.push('level_5');
      }

      for (const badge of newBadges) {
        await db.userBadge.create({
          data: { userId: user.id, badge },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update gamification' }, { status: 500 });
  }
}
