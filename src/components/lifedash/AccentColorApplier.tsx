'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useIsMounted } from '@/hooks/use-is-mounted';

/**
 * This component applies the accent color as a data-accent attribute
 * on the <html> element. It runs client-side only to avoid hydration mismatches.
 */
export function AccentColorApplier() {
  const { accentColor } = useAppStore();
  const mounted = useIsMounted();

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-accent', accentColor);
    }
  }, [accentColor, mounted]);

  return null;
}
