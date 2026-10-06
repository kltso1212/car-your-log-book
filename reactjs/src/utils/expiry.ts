import { parseISODate, toISODate } from './date';
import type { InsuranceRecord, LicenceRecord } from '../services/api';

// Expiry calculations for the 總覽 page. Computed, never stored:
// latest insurance date + 1 year − 1 day; latest licence date +
// (4 or 12 months by type) − 1 day. Returns '' when there is no record.

function shiftDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function daysInMonth(year: number, monthZeroBased: number): number {
  return new Date(year, monthZeroBased + 1, 0).getDate();
}

function shiftMonths(iso: string, months: number): string {
  const d = parseISODate(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, daysInMonth(d.getFullYear(), d.getMonth())));
  return toISODate(d);
}

const latestDate = (dates: string[]): string =>
  dates.reduce((a, b) => (a > b ? a : b), '');

export function insuranceExpiry(records: Array<{ date: string }>): string {
  const latest = latestDate(records.map(r => r.date));
  if (!latest) return '';
  const d = parseISODate(latest);
  d.setFullYear(d.getFullYear() + 1);
  return shiftDays(toISODate(d), -1);
}

export function licenceExpiry(records: Array<{ date: string; type: number }>): string {
  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = sorted[0];
  if (!latest) return '';
  return shiftDays(shiftMonths(latest.date, latest.type === 1 ? 4 : 12), -1);
}

// True when the expiry date is within `withinDays` (default 30) from today,
// overdue dates included — the summary and record pages render those in red.
export function isExpiringSoon(iso: string, withinDays = 30): boolean {
  if (!iso) return false;
  const today = toISODate(new Date());
  const due = parseISODate(iso).getTime();
  const limit = parseISODate(shiftDays(today, withinDays)).getTime();
  return due <= limit;
}

export type { InsuranceRecord, LicenceRecord };
