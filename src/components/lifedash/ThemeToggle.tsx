'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  if (!mounted) return <div className="w-9 h-9 rounded-xl bg-muted/30" />;

  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center transition-all duration-300 hover:bg-muted/60 hover:scale-105 active:scale-95"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
    </button>
  );
}
