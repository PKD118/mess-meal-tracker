import { isSlotEditable, todayDhakaISO, addDaysISO, cutoffForDate, firstOfPrevMonthISO } from '@/utils/cutoff';

describe('cutoff boundaries (Asia/Dhaka, fixed UTC+6)', () => {
  test('noon cutoff is exactly 03:00 UTC on the given date', () => {
    expect(cutoffForDate('2025-06-15', 'noon').toISOString()).toBe('2025-06-15T03:00:00.000Z');
  });

  test('night cutoff is exactly 12:00 UTC on the given date', () => {
    expect(cutoffForDate('2025-06-15', 'night').toISOString()).toBe('2025-06-15T12:00:00.000Z');
  });

  test('noon is editable one minute before 9am Dhaka (02:59 UTC)', () => {
    const now = new Date('2025-06-15T02:59:00.000Z');
    expect(isSlotEditable('2025-06-15', 'noon', now)).toBe(true);
  });

  test('noon is locked one minute after 9am Dhaka (03:01 UTC)', () => {
    const now = new Date('2025-06-15T03:01:00.000Z');
    expect(isSlotEditable('2025-06-15', 'noon', now)).toBe(false);
  });

  test('night stays editable after noon cutoff has passed, same day', () => {
    const now = new Date('2025-06-15T10:00:00.000Z'); // past noon cutoff, before night cutoff
    expect(isSlotEditable('2025-06-15', 'noon', now)).toBe(false);
    expect(isSlotEditable('2025-06-15', 'night', now)).toBe(true);
  });

  test('night is locked one minute after 6pm Dhaka (12:01 UTC)', () => {
    const now = new Date('2025-06-15T12:01:00.000Z');
    expect(isSlotEditable('2025-06-15', 'night', now)).toBe(false);
  });

  test('both slots are locked for a past date regardless of time of day', () => {
    const now = new Date('2025-06-16T00:00:01.000Z'); // one second into the next day
    expect(isSlotEditable('2025-06-15', 'noon', now)).toBe(false);
    expect(isSlotEditable('2025-06-15', 'night', now)).toBe(false);
  });
});

describe('Dhaka calendar date helpers', () => {
  test('todayDhakaISO rolls over at Dhaka midnight, not device-local midnight', () => {
    // 23:30 UTC on the 14th = 05:30 Dhaka on the 15th
    const now = new Date('2025-06-14T23:30:00.000Z');
    expect(todayDhakaISO(now)).toBe('2025-06-15');
  });

  test('todayDhakaISO stays on the same date just before Dhaka midnight', () => {
    // 17:59 UTC on the 14th = 23:59 Dhaka on the 14th
    const now = new Date('2025-06-14T17:59:00.000Z');
    expect(todayDhakaISO(now)).toBe('2025-06-14');
  });

  test('addDaysISO adds days and rolls over month/year boundaries', () => {
    expect(addDaysISO('2025-06-29', 3)).toBe('2025-07-02');
    expect(addDaysISO('2025-12-30', 3)).toBe('2026-01-02');
  });
});

describe('firstOfPrevMonthISO', () => {
  test('normal month rollback', () => {
    expect(firstOfPrevMonthISO('2025-06-15')).toBe('2025-05-01');
  });

  test('rolls back across a year boundary from January', () => {
    expect(firstOfPrevMonthISO('2026-01-15')).toBe('2025-12-01');
  });
});
