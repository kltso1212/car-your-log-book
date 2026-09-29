import type { FuelRecord } from '../types';

// Dates are 'YYYY-MM-DD' strings throughout the app, so plain string
// comparison orders them chronologically. odm breaks ties (same-day
// top-ups). Display order is newest-first; consumption math uses ascending.
export function compareFuelByDateDesc(a: FuelRecord, b: FuelRecord): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.odm - a.odm;
}

export function compareFuelByDateAsc(a: FuelRecord, b: FuelRecord): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.odm - b.odm;
}
