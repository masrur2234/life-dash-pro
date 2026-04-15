'use client';

import { useIsMounted } from '@/hooks/use-is-mounted';
import { useAppStore } from '@/stores/app-store';

interface GreetingHeaderProps {
  isDesktop?: boolean;
}

export function GreetingHeader({ isDesktop }: GreetingHeaderProps) {
  const mounted = useIsMounted();
  const { user } = useAppStore();

  const now = mounted ? new Date() : null;
  const hour = now ? now.getHours() : 12;
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const dateStr = mounted && now
    ? now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const userName = user?.name || 'User';
  const firstName = userName.split(' ')[0];

  if (!mounted) {
    return (
      <div className="transition-all duration-500 opacity-0 translate-y-4">
        <div className="h-5 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="h-8 w-64 bg-muted/30 rounded mt-2 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="transition-all duration-500 opacity-100 translate-y-0">
      <p className="text-sm text-muted-foreground mb-1">{dateStr}</p>
      <h1 className={isDesktop ? 'text-4xl font-bold tracking-tight' : 'text-2xl font-bold tracking-tight'}>
        {greeting},{' '}
        <span className="gradient-text">{firstName}</span>{' '}
        <span className="inline-block animate-float">👋</span>
      </h1>
      {isDesktop && (
        <p className="text-sm text-muted-foreground mt-2 max-w-lg">
          Here&apos;s your life overview for today. Stay on track and keep building those habits!
        </p>
      )}
    </div>
  );
}
