'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { cn } from '@/lib/utils';

type Status = 'loading' | 'ok' | 'down';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function ApiHealthBadge(): ReactElement {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    void fetch(`${API_BASE}/health`, { cache: 'no-store' })
      .then((r) => (r.ok ? 'ok' : 'down'))
      .catch(() => 'down' as const)
      .then((s) => {
        if (!cancelled) setStatus(s);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dot =
    status === 'ok' ? 'bg-emerald-500' : status === 'down' ? 'bg-red-500' : 'bg-amber-500';
  const label =
    status === 'ok' ? 'API en ligne' : status === 'down' ? 'API hors ligne' : 'Vérification…';

  return (
    <div className="border-border inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      {label}
    </div>
  );
}
