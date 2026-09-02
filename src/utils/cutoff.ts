import type { Slot } from '@/types/models';

// Bangladesh has no DST — a fixed UTC+6 offset is safe to hardcode.
const DHAKA_OFFSET_MINUTES = 6 * 60;

// Noon cutoff = 9:00 AM Dhaka = 03:00 UTC same calendar date.
// Night cutoff = 6:00 PM Dhaka = 12:00 UTC same calendar date.
const CUTOFF_UTC_HOUR: Record<Slot, number> = {
  noon: 3,
  night: 12,
};

function parseISO(dateISO: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateISO.split('-').map(Number);
  return { y, m, d };
}

export function cutoffForDate(dateISO: string, slot: Slot): Date {
  const { y, m, d } = parseISO(dateISO);
  return new Date(Date.UTC(y, m - 1, d, CUTOFF_UTC_HOUR[slot], 0, 0));
}

export function isSlotEditable(dateISO: string, slot: Slot, now: Date = new Date()): boolean {
  return now.getTime() < cutoffForDate(dateISO, slot).getTime();
}

export function todayDhakaISO(now: Date = new Date()): string {
  const dhaka = new Date(now.getTime() + DHAKA_OFFSET_MINUTES * 60 * 1000);
  const y = dhaka.getUTCFullYear();
  const m = String(dhaka.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dhaka.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(dateISO: string, days: number): string {
  const { y, m, d } = parseISO(dateISO);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function isSameOrAfter(dateA: string, dateB: string): boolean {
  return dateA >= dateB; // ISO YYYY-MM-DD strings sort lexically = chronologically
}

// Local (no-timezone) Date matching the literal Dhaka calendar date, for
// display formatting only — never for arithmetic (use addDaysISO for that).
export function parseISODateLocal(dateISO: string): Date {
  const { y, m, d } = parseISO(dateISO);
  return new Date(y, m - 1, d);
}

// History is scoped to "this month and the previous month, no earlier" —
// this is the start of that window relative to a given date.
export function firstOfPrevMonthISO(dateISO: string): string {
  const { y, m } = parseISO(dateISO);
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
}
