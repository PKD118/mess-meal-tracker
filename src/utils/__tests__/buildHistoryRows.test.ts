import { buildHistoryRows } from '@/utils/buildHistoryRows';
import type { MealDayDoc, MessCancellationDoc } from '@/types/models';

function meal(date: string, overrides: Partial<MealDayDoc> = {}): MealDayDoc {
  return { uid: 'u1', date, noon: false, night: false, noonGuests: 0, nightGuests: 0, updatedAt: 0, ...overrides };
}

function cancel(date: string, overrides: Partial<MessCancellationDoc> = {}): MessCancellationDoc {
  return { date, noon: false, night: false, setBy: 'mgr', updatedAt: 0, ...overrides };
}

describe('buildHistoryRows', () => {
  test('a lingering all-default doc produces no row', () => {
    const rows = buildHistoryRows({ '2025-06-10': meal('2025-06-10') }, {});
    expect(rows).toEqual([]);
  });

  test('self-off noon is attributed to self', () => {
    const rows = buildHistoryRows({ '2025-06-10': meal('2025-06-10', { noon: true }) }, {});
    expect(rows).toEqual([{ date: '2025-06-10', noonOffBy: 'self', nightOffBy: null }]);
  });

  test('mess cancellation is attributed to mess even if the member also had it off', () => {
    const rows = buildHistoryRows(
      { '2025-06-10': meal('2025-06-10', { noon: true }) },
      { '2025-06-10': cancel('2025-06-10', { noon: true }) }
    );
    expect(rows).toEqual([{ date: '2025-06-10', noonOffBy: 'mess', nightOffBy: null }]);
  });

  test('a date with only a cancellation doc (no personal doc) still produces a row', () => {
    const rows = buildHistoryRows({}, { '2025-06-11': cancel('2025-06-11', { night: true }) });
    expect(rows).toEqual([{ date: '2025-06-11', noonOffBy: null, nightOffBy: 'mess' }]);
  });

  test('sorts reverse chronologically', () => {
    const rows = buildHistoryRows(
      {
        '2025-06-10': meal('2025-06-10', { noon: true }),
        '2025-06-12': meal('2025-06-12', { night: true }),
        '2025-06-11': meal('2025-06-11', { noon: true }),
      },
      {}
    );
    expect(rows.map((r) => r.date)).toEqual(['2025-06-12', '2025-06-11', '2025-06-10']);
  });
});
