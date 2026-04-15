'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

export function ProductivityScoreCard() {
  const [score, setScore] = useState(0);
  const mounted = useIsMounted();

  useEffect(() => {
    fetch('/api/insights')
      .then((res) => res.json())
      .then((data) => {
        if (data.productivityScore !== undefined) {
          setScore(data.productivityScore);
        }
      })
      .catch(() => {
        setScore(68);
      });
  }, []);

  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (mounted ? score / 100 : 0) * circumference;

  const getColor = () => {
    if (score < 30) return '#EF4444';
    if (score < 70) return '#F59E0B';
    return '#10B981';
  };

  const getLabel = () => {
    if (score < 30) return 'Needs Work';
    if (score < 70) return 'Getting There';
    return 'Great Job!';
  };

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="font-semibold text-base">Productivity Score</h3>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
        {/* Score ring */}
        <div className="flex flex-col items-center py-2 shrink-0">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/20"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={getColor()}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                  transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl font-bold transition-colors duration-500"
                style={{ color: getColor() }}
              >
                {score}
              </span>
            </div>
          </div>
          <p className="text-sm font-medium mt-3" style={{ color: getColor() }}>
            {getLabel()}
          </p>
        </div>

        {/* Stats on desktop */}
        <div className="hidden lg:flex flex-col gap-3 flex-1 pt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <span className="text-sm text-muted-foreground">Tasks Done</span>
            <span className="text-sm font-semibold">2/3</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <span className="text-sm text-muted-foreground">Budget Status</span>
            <span className="text-sm font-semibold text-amber-400">72%</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <span className="text-sm text-muted-foreground">Habit Streak</span>
            <span className="text-sm font-semibold">🔥 5 days</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Based on tasks, budget & consistency</p>
        </div>
      </div>
    </div>
  );
}
