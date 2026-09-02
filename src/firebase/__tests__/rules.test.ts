import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Boundary-second precision (8:59am vs 9:01am) is covered deterministically in
// src/utils/__tests__/cutoff.test.ts via an injectable clock — the emulator's
// request.time is the real wall clock and can't be pinned to a second. These
// tests instead verify the rules' structural correctness: ownership, guest
// range, unchanged-value bypass, and the manager cutoff-bypass decision.

const MEMBER_UID = 'member1';
const OTHER_MEMBER_UID = 'member2';
const MANAGER_UID = 'manager1';

const FAR_FUTURE_DATE = '2099-01-10'; // cutoffs definitely haven't passed
const FAR_PAST_DATE = '2000-01-10'; // cutoffs definitely have passed

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'mess-meal-tracker-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', MEMBER_UID), {
      name: 'Member', phone: '1', isManager: false, locale: 'en', createdAt: 0,
    });
    await setDoc(doc(db, 'users', OTHER_MEMBER_UID), {
      name: 'Other', phone: '2', isManager: false, locale: 'en', createdAt: 0,
    });
    await setDoc(doc(db, 'users', MANAGER_UID), {
      name: 'Manager', phone: '3', isManager: true, locale: 'en', createdAt: 0,
    });
  });
});

function mealDay(uid: string, date: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    uid,
    date,
    noon: false,
    night: false,
    noonGuests: 0,
    nightGuests: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('users collection', () => {
  test('any signed-in member can read any profile', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'users', OTHER_MEMBER_UID)));
  });

  test('unauthenticated read is blocked', async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), 'users', MEMBER_UID)));
  });

  test('client cannot create/overwrite a users doc', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertFails(setDoc(doc(ctx.firestore(), 'users', MEMBER_UID), { name: 'Hacked' }));
  });

  test('member can update their own locale field only', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertSucceeds(updateDoc(doc(ctx.firestore(), 'users', MEMBER_UID), { locale: 'bn' }));
  });

  test('member cannot update another member\'s locale', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertFails(updateDoc(doc(ctx.firestore(), 'users', OTHER_MEMBER_UID), { locale: 'bn' }));
  });

  test('member cannot self-escalate isManager alongside a locale update', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertFails(updateDoc(doc(ctx.firestore(), 'users', MEMBER_UID), { locale: 'bn', isManager: true }));
  });

  test('locale update rejects a value outside en/bn', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertFails(updateDoc(doc(ctx.firestore(), 'users', MEMBER_UID), { locale: 'fr' }));
  });
});

describe('mealDays cutoff + ownership', () => {
  test('member can create/edit their own mealDays doc for a far-future date', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    const data = mealDay(MEMBER_UID, FAR_FUTURE_DATE, { noon: true, noonGuests: 3 });
    await assertSucceeds(setDoc(doc(ctx.firestore(), 'mealDays', `${MEMBER_UID}_${FAR_FUTURE_DATE}`), data));
  });

  test('member cannot change a real value for a far-past date (cutoff long passed)', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    const data = mealDay(MEMBER_UID, FAR_PAST_DATE, { noon: true });
    await assertFails(setDoc(doc(ctx.firestore(), 'mealDays', `${MEMBER_UID}_${FAR_PAST_DATE}`), data));
  });

  test('writing unchanged default values for a far-past date is allowed (no-op, not a real edit)', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    // doc doesn't exist yet -> prior values default to false/0 -> this write changes nothing
    const data = mealDay(MEMBER_UID, FAR_PAST_DATE);
    await assertSucceeds(setDoc(doc(ctx.firestore(), 'mealDays', `${MEMBER_UID}_${FAR_PAST_DATE}`), data));
  });

  test('member cannot write to another member\'s mealDays doc', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    const data = mealDay(OTHER_MEMBER_UID, FAR_FUTURE_DATE, { noon: true });
    await assertFails(setDoc(doc(ctx.firestore(), 'mealDays', `${OTHER_MEMBER_UID}_${FAR_FUTURE_DATE}`), data));
  });

  test('guest count of 5 is allowed, 6 is rejected', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertSucceeds(setDoc(
      doc(ctx.firestore(), 'mealDays', `${MEMBER_UID}_${FAR_FUTURE_DATE}`),
      mealDay(MEMBER_UID, FAR_FUTURE_DATE, { noonGuests: 5 })
    ));
    await assertFails(setDoc(
      doc(ctx.firestore(), 'mealDays', `${MEMBER_UID}_${FAR_FUTURE_DATE}`),
      mealDay(MEMBER_UID, FAR_FUTURE_DATE, { noonGuests: 6 })
    ));
  });

  test('any signed-in member can read any mealDays doc (roster needs this)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'mealDays', `${OTHER_MEMBER_UID}_${FAR_FUTURE_DATE}`),
        mealDay(OTHER_MEMBER_UID, FAR_FUTURE_DATE, { noon: true })
      );
    });
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'mealDays', `${OTHER_MEMBER_UID}_${FAR_FUTURE_DATE}`)));
  });
});

describe('messCancellations manager bypass', () => {
  test('manager can cancel for a far-past date (cutoff bypass)', async () => {
    const ctx = testEnv.authenticatedContext(MANAGER_UID);
    await assertSucceeds(setDoc(doc(ctx.firestore(), 'messCancellations', FAR_PAST_DATE), {
      date: FAR_PAST_DATE, noon: true, night: false, setBy: MANAGER_UID, updatedAt: 0,
    }));
  });

  test('non-manager member cannot write a mess cancellation', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID);
    await assertFails(setDoc(doc(ctx.firestore(), 'messCancellations', FAR_FUTURE_DATE), {
      date: FAR_FUTURE_DATE, noon: true, night: false, setBy: MEMBER_UID, updatedAt: 0,
    }));
  });

  test('manager cannot forge setBy as someone else', async () => {
    const ctx = testEnv.authenticatedContext(MANAGER_UID);
    await assertFails(setDoc(doc(ctx.firestore(), 'messCancellations', FAR_FUTURE_DATE), {
      date: FAR_FUTURE_DATE, noon: true, night: false, setBy: MEMBER_UID, updatedAt: 0,
    }));
  });
});
