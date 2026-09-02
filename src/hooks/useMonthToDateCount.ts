import { useMemo } from 'react';
import { useOwnMealDays } from '@/hooks/useOwnMealDays';
import { useMessCancellationsRange } from '@/hooks/useMessCancellationsRange';
import { todayDhakaISO, addDaysISO } from '@/utils/cutoff';
import { resolveSlotTotal } from '@/utils/resolveMeal';

function firstOfMonthISO(dateISO: string): string {
  const [y, m] = dateISO.split('-');
  return `${y}-${m}-01`;
}

// Total meals (self + guests) taken from the 1st of the current Dhaka-calendar
// month through today, inclusive. Iterates every calendar day in range, not
// just days with a mealDays doc — most days have no doc (default ON). Clamped
// to the account's creation date so days before the member even existed don't
// get counted as default-on meals they never actually had.
export function useMonthToDateCount(uid: string | undefined, accountCreatedAt: number | undefined) {
  const today = todayDhakaISO();
  const monthStart = firstOfMonthISO(today);
  const createdDate = accountCreatedAt ? todayDhakaISO(new Date(accountCreatedAt)) : monthStart;
  const start = createdDate > monthStart ? createdDate : monthStart;
  const { byDate: mealByDate, loading: mealLoading, error: mealError } = useOwnMealDays(uid, start, today);
  const { byDate: cancelByDate, loading: cancelLoading, error: cancelError } = useMessCancellationsRange(start, today);

  const total = useMemo(() => {
    let sum = 0;
    for (let d = start; d <= today; d = addDaysISO(d, 1)) {
      sum += resolveSlotTotal('noon', mealByDate[d], cancelByDate[d]);
      sum += resolveSlotTotal('night', mealByDate[d], cancelByDate[d]);
    }
    return sum;
  }, [mealByDate, cancelByDate, start, today]);

  return { total, loading: mealLoading || cancelLoading, error: mealError ?? cancelError };
}
