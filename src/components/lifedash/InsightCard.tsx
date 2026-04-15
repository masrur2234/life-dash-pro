'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, Moon, TrendingUp, PiggyBank } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

interface Insight {
  icon: React.ReactNode;
  text: string;
}

export function InsightCard() {
  const [insights, setInsights] = useState<Insight[]>([
    { icon: <Moon className="w-4 h-4" />, text: 'You spend most at night 🌙' },
    { icon: <TrendingUp className="w-4 h-4" />, text: 'Most productive day: Monday' },
    { icon: <PiggyBank className="w-4 h-4" />, text: 'Potential savings: 300k/month' },
  ]);
  const mounted = useIsMounted();

  useEffect(() => {
    fetch('/api/insights')
      .then((res) => res.json())
      .then((data) => {
        const newInsights: Insight[] = [];
        if (data.spendingPattern?.mostlyNight) {
          newInsights.push({ icon: <Moon className="w-4 h-4" />, text: 'You spend most at night 🌙' });
        } else {
          newInsights.push({ icon: <TrendingUp className="w-4 h-4" />, text: 'You spend mostly during the day ☀️' });
        }
        newInsights.push({
          icon: <TrendingUp className="w-4 h-4" />,
          text: `Most productive day: ${data.mostProductiveDay || 'Monday'}`,
        });
        newInsights.push({
          icon: <PiggyBank className="w-4 h-4" />,
          text: `Potential savings: ${data.potentialSavings ? `${(data.potentialSavings / 1000).toFixed(0)}k` : '0'}k/month`,
        });
        if (newInsights.length > 0) {
          setInsights(newInsights);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className={`glass-card rounded-2xl p-5 gradient-border animate-slide-up stagger-2 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <h3 className="font-semibold text-base">AI Insights</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 transition-all duration-200 hover:bg-muted/50"
            style={{
              animationDelay: mounted ? `${0.2 + i * 0.1}s` : '0s',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'all 0.4s ease-out',
            }}
          >
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white shrink-0 mt-0.5">
              {insight.icon}
            </div>
            <p className="text-sm leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
