import type { MealDayDoc, MessCancellationDoc } from '@/types/models';

export type OffBy = 'self' | 'mess' | null;

export interface HistoryRow {
  date: string;
  noonOffBy: OffBy;
  nightOffBy: OffBy;
}

// Only days where something actually deviated from default-ON show up.
// mealDays docs can linger with all-default values after a revert (writes
// are never deleted, per the security rules), so both flags being false and
// guests being 0 must NOT produce a history row.
export function buildHistoryRows(
  mealByDate: Record<string, MealDayDoc>,
  cancelByDate: Record<string, MessCancellationDoc>
): HistoryRow[] {
  const dates = new Set([...Object.keys(mealByDate), ...Object.keys(cancelByDate)]);
  const rows: HistoryRow[] = [];

  dates.forEach((date) => {
    const meal = mealByDate[date];
    const cancel = cancelByDate[date];
    const noonOffBy: OffBy = cancel?.noon ? 'mess' : meal?.noon ? 'self' : null;
    const nightOffBy: OffBy = cancel?.night ? 'mess' : meal?.night ? 'self' : null;
    if (noonOffBy || nightOffBy) {
      rows.push({ date, noonOffBy, nightOffBy });
    }
  });

  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}
