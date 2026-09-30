import type { ParkingRecord } from '../services/api';

// Newest-first (date, then insertion order); no odm exists on parking visits.
export function compareParkingByDateDesc(a: ParkingRecord, b: ParkingRecord): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return Number(b.id ?? 0) - Number(a.id ?? 0);
}
