'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

interface GamificationData {
  user: {
    name: string;
    level: number;
    levelName: string;
    xp: number;
    xpToNext: number;
    xpProgress: number;
  };
  badges: { id: string; name: string }[];
}

export function GamificationBar() {
  const [data, setData] = useState<GamificationData | null>(null);
  const mounted = useIsMounted();

  useEffect(() => {
    fetch('/api/gamification')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div
      className={`sticky top-0 z-50 glass-card rounded-b-2xl px-4 py-3 transition-all duration-500 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold gradient-text">Lv.{data.user.level}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground font-medium">{data.user.levelName}</span>
            <span className="text-[10px] text-muted-foreground">{data.user.xp} XP</span>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-1000 ease-out"
              style={{ width: mounted ? `${data.user.xpProgress}%` : '0%' }}
            />
          </div>
        </div>

        {data.badges.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-medium text-muted-foreground">{data.badges.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
