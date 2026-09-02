import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { MealDayDoc } from '@/types/models';

// Keyed by date (YYYY-MM-DD). A missing key means default ON, no guests —
// mealDays docs are sparse, only written when something deviates from default.
export function useOwnMealDays(uid: string | undefined, startDate: string, endDate: string) {
  const [byDate, setByDate] = useState<Record<string, MealDayDoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setByDate({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'mealDays'),
      where('uid', '==', uid),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Record<string, MealDayDoc> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as MealDayDoc;
          next[data.date] = data;
        });
        setByDate(next);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid, startDate, endDate]);

  return { byDate, loading, error };
}
