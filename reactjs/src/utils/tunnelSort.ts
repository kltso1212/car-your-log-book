import type { TunnelRecord } from '../services/api';

// Newest-first (date, then insertion order); no odm exists on tunnel trips.
export function compareTunnelByDateDesc(a: TunnelRecord, b: TunnelRecord): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return Number(b.id ?? 0) - Number(a.id ?? 0);
}
