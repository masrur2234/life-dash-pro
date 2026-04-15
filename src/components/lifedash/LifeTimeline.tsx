'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

interface Transaction {
  date: string;
  category: string;
  description: string | null;
  amount: number;
}

interface TimelineEntry {
  time: string;
  icon: string;
  label: string;
  detail: string;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Food: '🍔',
    Transport: '🚗',
    Entertainment: '🎬',
    Shopping: '🛍️',
    Bills: '📄',
    Other: '📦',
  };
  return icons[category] || '📦';
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    Food: 'Dining',
    Transport: 'Travel',
    Entertainment: 'Fun',
    Shopping: 'Shopping',
    Bills: 'Bills',
    Other: 'Other',
  };
  return labels[category] || category;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1000) return `${(abs / 1000).toFixed(0)}k`;
  return abs.toString();
}

export function LifeTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const mounted = useIsMounted();

  useEffect(() => {
    fetch('/api/transactions')
      .then((res) => res.json())
      .then((data: Transaction[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const timeline: TimelineEntry[] = sorted.slice(0, 6).map((t) => ({
            time: formatTime(t.date),
            icon: getCategoryIcon(t.category),
            label: getCategoryLabel(t.category),
            detail: t.description || `${formatAmount(t.amount)} spent`,
          }));
          setEntries(timeline);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className={`glass-card rounded-2xl p-5 animate-slide-up stagger-7 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Clock className="w-4 h-4 text-violet-400" />
        </div>
        <h3 className="font-semibold text-base">Life Replay</h3>
      </div>

      <div className="relative pl-6">
        {/* Timeline line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-[2px] rounded-full"
          style={{
            background: 'linear-gradient(180deg, #8B5CF6, #EC4899, transparent)',
            transition: 'height 1s ease-out',
          }}
        />

        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="relative flex items-start gap-3 transition-all duration-300"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateX(0)' : 'translateX(-8px)',
                transitionDelay: `${0.3 + i * 0.1}s`,
              }}
            >
              {/* Dot */}
              <div
                className="absolute left-[-20px] top-1.5 w-4 h-4 rounded-full border-2 border-background gradient-primary"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{entry.time}</span>
                  <span className="text-sm">{entry.icon}</span>
                  <span className="text-sm font-medium">{entry.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
