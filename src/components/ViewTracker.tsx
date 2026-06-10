'use client';

import { useEffect, useRef } from 'react';

export function ViewTracker({ id }: { id: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    
    // Fire and forget
    fetch(`/api/problems/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id]);

  return null;
}
