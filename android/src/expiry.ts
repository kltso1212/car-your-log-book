import { parseISODate, toISODate } from './date';

// Expiry calculations for the 總覽 page. Computed, never stored:
// latest insurance date + 1 year − 1 day; latest licence date +
// (4 or 12 months by type) − 1 day. Returns '' when there is no record.

function shiftDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function shiftMonths(iso: string, months: number): string {
  const d = parseISODate(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, daysInMonth(d.getFullYear(), d.getMonth())));
  return toISODate(d);
}

function daysInMonth(year: number, monthZeroBased: number): number {
  return new Date(year, monthZeroBased + 1, 0).getDate();
}

export function insuranceExpiry(records: Array<{ date: string }>): string {
  if (records.length === 0) return '';
  const dates = records.map(r => r.date).sort();
  const latest = dates[dates.length - 1]!;
  const d = parseISODate(latest);
  d.setFullYear(d.getFullYear() + 1);
  return shiftDays(toISODate(d), -1);
}

export function licenceExpiry(records: Array<{ date: string; type: number }>): string {
  if (records.length === 0) return '';
  const latest = [...records].sort((a, b) => (a.date < b.date ? 1 : -1))[0]!;
  return shiftDays(shiftMonths(latest.date, latest.type === 1 ? 4 : 12), -1);
}
