import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { MealDayDoc, MessCancellationDoc } from '@/types/models';
import { useAllUsers } from '@/hooks/useAllUsers';
import { resolveSlotTotal } from '@/utils/resolveMeal';

export interface RosterRow {
  uid: string;
  name: string;
  noonTotal: number;
  nightTotal: number;
}

export function useMessRoster(date: string) {
  const { users, loading: usersLoading, error: usersError } = useAllUsers();
  const [mealDaysByUid, setMealDaysByUid] = useState<Record<string, MealDayDoc>>({});
  const [cancellation, setCancellation] = useState<MessCancellationDoc | undefined>(undefined);
  const [mealDaysLoading, setMealDaysLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setMealDaysLoading(true);
    const unsub = onSnapshot(
      collection(db, 'mealDays', date, 'entries'),
      (snap) => {
        const next: Record<string, MealDayDoc> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as MealDayDoc;
          next[data.uid] = data;
        });
        setMealDaysByUid(next);
        setMealDaysLoading(false);
      },
      (err) => {
        setError(err);
        setMealDaysLoading(false);
      }
    );
    return unsub;
  }, [date]);

  useEffect(() => {
    setCancelLoading(true);
    const unsub = onSnapshot(
      doc(db, 'messCancellations', date),
      (snap) => {
        setCancellation(snap.exists() ? (snap.data() as MessCancellationDoc) : undefined);
        setCancelLoading(false);
      },
      (err) => {
        setError(err);
        setCancelLoading(false);
      }
    );
    return unsub;
  }, [date]);

  const rows: RosterRow[] = users.map((u) => {
    const mealDay = mealDaysByUid[u.uid];
    return {
      uid: u.uid,
      name: u.name,
      noonTotal: resolveSlotTotal('noon', mealDay, cancellation),
      nightTotal: resolveSlotTotal('night', mealDay, cancellation),
    };
  });

  const noonMessTotal = rows.reduce((sum, r) => sum + r.noonTotal, 0);
  const nightMessTotal = rows.reduce((sum, r) => sum + r.nightTotal, 0);

  return {
    rows,
    noonMessTotal,
    nightMessTotal,
    cancellation,
    loading: usersLoading || mealDaysLoading || cancelLoading,
    error: error ?? usersError,
  };
}
