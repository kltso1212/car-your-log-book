import { compareFuelByDateAsc } from './fuelSort';
import type { FuelRecord } from '../types';

// Shared vehicle stats for the 總覽 page (web + same formula as android).
// maxOdm spans fuel, charge AND service records (electric vehicles only
// have charge records).

export function maxOdm(records: Array<{ odm: number }>): number {
  return records.reduce((max, r) => Math.max(max, r.odm), 0);
}

// The record behind 現時行車哩數: highest odm, latest date on ties.
// Its date is shown as 最近更新日期.
export function maxOdmRecord<T extends { odm: number; date: string }>(
  records: T[],
): T | undefined {
  let best: T | undefined;
  for (const r of records) {
    if (!best || r.odm > best.odm || (r.odm === best.odm && r.date > best.date)) {
      best = r;
    }
  }
  return best;
}

export function averageConsumption(records: FuelRecord[]): number {
  if (records.length <= 1) return 0;
  const ascending = [...records].sort(compareFuelByDateAsc);
  let consumption = 0;
  for (let i = 1; i < ascending.length; ++i) {
    const current = ascending[i];
    const previous = ascending[i - 1];
    if (!current || !previous) continue;
    if (current.odm === previous.odm) continue;
    consumption += current.price / (current.odm - previous.odm);
  }
  return consumption / (ascending.length - 1);
}

interface ChargeLike {
  date: string;
  odm: number;
  price: number;
}

// Same $/km formula as fuel, over charge records (kWh never enters the
// average — exactly like litre never enters the fuel one).
export function averagePowerConsumption(records: ChargeLike[]): number {
  if (records.length <= 1) return 0;
  const ascending = [...records].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.odm - b.odm,
  );
  let consumption = 0;
  for (let i = 1; i < ascending.length; ++i) {
    const current = ascending[i]!;
    const previous = ascending[i - 1]!;
    if (current.odm === previous.odm) continue;
    consumption += current.price / (current.odm - previous.odm);
  }
  return consumption / (ascending.length - 1);
}
