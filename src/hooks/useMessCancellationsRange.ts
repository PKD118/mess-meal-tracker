import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { MessCancellationDoc } from '@/types/models';

// Keyed by date (YYYY-MM-DD). A missing key means no mess-wide cancellation that day.
export function useMessCancellationsRange(startDate: string, endDate: string) {
  const [byDate, setByDate] = useState<Record<string, MessCancellationDoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'messCancellations'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Record<string, MessCancellationDoc> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as MessCancellationDoc;
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
  }, [startDate, endDate]);

  return { byDate, loading, error };
}
