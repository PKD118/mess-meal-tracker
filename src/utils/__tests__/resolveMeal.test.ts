import { resolveSlotTotal } from '@/utils/resolveMeal';
import type { MealDayDoc, MessCancellationDoc } from '@/types/models';

function mealDay(overrides: Partial<MealDayDoc> = {}): MealDayDoc {
  return { uid: 'u1', date: '2025-06-15', noon: false, night: false, noonGuests: 0, nightGuests: 0, updatedAt: 0, ...overrides };
}

describe('resolveSlotTotal', () => {
  test('default (no doc, no cancellation) = 1 meal, no guests', () => {
    expect(resolveSlotTotal('noon', undefined, undefined)).toBe(1);
  });

  test('self off, no guests = 0', () => {
    expect(resolveSlotTotal('noon', mealDay({ noon: true }), undefined)).toBe(0);
  });

  test('self off but guests still booked = guest count only', () => {
    expect(resolveSlotTotal('noon', mealDay({ noon: true, noonGuests: 2 }), undefined)).toBe(2);
  });

  test('self on plus guests = 1 + guests', () => {
    expect(resolveSlotTotal('night', mealDay({ nightGuests: 3 }), undefined)).toBe(4);
  });

  test('mess-wide cancellation zeroes the slot regardless of self/guest state', () => {
    const cancellation: MessCancellationDoc = { date: '2025-06-15', noon: true, night: false, setBy: 'mgr', updatedAt: 0 };
    expect(resolveSlotTotal('noon', mealDay({ noonGuests: 4 }), cancellation)).toBe(0);
  });

  test('mess-wide cancellation on one slot does not affect the other', () => {
    const cancellation: MessCancellationDoc = { date: '2025-06-15', noon: true, night: false, setBy: 'mgr', updatedAt: 0 };
    expect(resolveSlotTotal('night', mealDay({ nightGuests: 1 }), cancellation)).toBe(2);
  });
});
