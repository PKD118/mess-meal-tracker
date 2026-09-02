import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Locale, MealDayDoc, MessCancellationDoc } from '@/types/models';

// Callers must always pass the complete resulting field set (never a partial
// patch) — the security rules compare each field against its prior stored
// value to decide whether that field's cutoff applies, so an incomplete
// payload would make untouched fields look like edits.
export function writeOwnMealDay(fields: Omit<MealDayDoc, 'updatedAt'> & { updatedAt?: number }) {
  const id = `${fields.uid}_${fields.date}`;
  return setDoc(doc(db, 'mealDays', id), {
    ...fields,
    updatedAt: Date.now(),
  });
}

export function writeMessCancellation(fields: Omit<MessCancellationDoc, 'updatedAt'> & { updatedAt?: number }) {
  return setDoc(doc(db, 'messCancellations', fields.date), {
    ...fields,
    updatedAt: Date.now(),
  });
}

export function writeOwnLocale(uid: string, locale: Locale) {
  return updateDoc(doc(db, 'users', uid), { locale });
}
