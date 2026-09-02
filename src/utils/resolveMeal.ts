import type { MealDayDoc, MessCancellationDoc, Slot } from '@/types/models';

// Single source of truth for "how many meals does this add up to" — used by
// the roster, the mess totals, and the personal month-to-date count so they
// never drift out of sync with each other.
export function resolveSlotTotal(
  slot: Slot,
  mealDay: MealDayDoc | undefined,
  cancellation: MessCancellationDoc | undefined
): number {
  const cancelled = slot === 'noon' ? cancellation?.noon ?? false : cancellation?.night ?? false;
  if (cancelled) return 0;
  const selfOff = slot === 'noon' ? mealDay?.noon ?? false : mealDay?.night ?? false;
  const guests = slot === 'noon' ? mealDay?.noonGuests ?? 0 : mealDay?.nightGuests ?? 0;
  return (selfOff ? 0 : 1) + guests;
}
