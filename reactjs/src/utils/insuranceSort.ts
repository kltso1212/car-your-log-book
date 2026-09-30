import type { InsuranceRecord } from '../services/api';

// Newest-first (date, then insertion order).
export function compareInsuranceByDateDesc(a: InsuranceRecord, b: InsuranceRecord): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return Number(b.id ?? 0) - Number(a.id ?? 0);
}
