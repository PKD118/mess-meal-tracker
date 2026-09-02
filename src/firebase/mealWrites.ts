import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Locale, MealDayDoc, MessCancellationDoc } from '@/types/models';

// Callers must always pass the complete resulting field set (never a partial
// patch) — the security rules compare each field against its prior stored
// value to decide whether that field's cutoff applies, so an incomplete
// payload would make untouched fields look like edits.
// Day-wise: mealDays/{date}/entries/{uid} — one doc per date holding one
// entry per member (+ their guests), so a day's roster is a single read.
export function writeOwnMealDay(fields: Omit<MealDayDoc, 'updatedAt'> & { updatedAt?: number }) {
  return setDoc(doc(db, 'mealDays', fields.date, 'entries', fields.uid), {
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

// First-login bootstrap — always non-manager with an empty name to fill in
// later. isManager can only be granted afterward by an admin via console.
export function createOwnProfile(uid: string) {
  return setDoc(doc(db, 'users', uid), {
    name: '',
    phone: '',
    isManager: false,
    locale: 'en',
    createdAt: Date.now(),
  });
}
