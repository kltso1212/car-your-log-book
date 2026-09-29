import type { ChargeRecord } from '../services/api';

// Newest-first, odm tiebreak — same contract as fuelSort for fuel records.
export function compareChargeByDateDesc(a: ChargeRecord, b: ChargeRecord): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.odm - a.odm;
}
