'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

function getSnapshot() {
  return true;
}

export function useIsMounted() {
  // On server, returns false. On client after hydration, returns true.
  return useSyncExternalStore(emptySubscribe, getSnapshot, () => false);
}
