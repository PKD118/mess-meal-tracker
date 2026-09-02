# Mess Meal Tracker

A bilingual (English / বাংলা) React Native app for tracking daily meal attendance in a shared mess (Bangladeshi student/shared-housing dining system). Members mark their own noon/night meal on or off up to 10 days ahead; a manager can cancel a meal mess-wide in an emergency. Built with Expo + Firebase.

## What it does

- **Default is ON.** Every member is assumed to eat every meal (noon and night) unless they explicitly turn a slot off for a specific day. Nothing needs to be recorded for a normal day.
- **Editable window: today + next 9 days (10 days total).** Each slot locks at its own cutoff — **9:00 AM Dhaka time for noon, 6:00 PM Dhaka time for night** — computed on a fixed UTC+6 offset (Bangladesh has no DST). A slot is fully reversible (off → on → off, any number of times) right up until its cutoff, then it's frozen — enforced both in the UI and, authoritatively, in Firestore security rules.
- **Guest meals.** A member can add 0–5 guest meals to either slot on any editable day, subject to the same cutoff. If they turn their own meal off while guests are still booked for that slot, a dedicated confirm step asks whether to cancel those guests too, or leave them intact.
- **Manager mess-wide cancellation.** A designated manager (`isManager: true` on their profile) can cancel noon, night, or both for everyone at once — and can do this **at any time**, bypassing the member cutoff, for genuine emergencies (gas outage, no ingredients, etc.).
- **Every write is confirm-gated.** Toggling a meal, changing a guest count, or a manager's mess-wide cancel — nothing saves on a single tap. A confirm dialog sits between every staged change and the actual write, so a mis-tap never costs someone a meal or a guest slot.
- **Roster + totals, visible to everyone.** The Dashboard shows a live roster of what every member is having today (name + total meals per slot, guests folded in) and two running totals ("Noon: 18", "Night: 14") so whoever's cooking knows exactly how many meals to prepare.
- **History is read-only and time-boxed.** Past days can't be edited. The History tab only shows the current month and the previous one — nothing older.
- **Fully bilingual.** A language toggle (top-right, every screen) switches the whole UI between English and বাংলা instantly, persisted on-device and best-effort synced to the user's profile.

## Screens

| Screen | Purpose |
|---|---|
| **Login** | Email/password sign-in. No self-signup — a manager creates each member's account. |
| **Dashboard** | Today's own meal editor (pill + guest stepper per slot), mess-wide totals, the roster table, month-to-date personal meal count, and (managers only) the mess-wide cancel controls. |
| **Meal Planner** | Tomorrow through +9 days, one card per day, same pill + guest stepper editor as the Dashboard, staged edits with a per-day confirm summary. |
| **History** | Read-only list of past days where something was off (self-toggled or mess-cancelled), current + previous month only. |

## Tech stack

- **Expo SDK 57** (React Native 0.86, React 19, TypeScript), file-based routing via **expo-router**
- **Firebase JS SDK** (`firebase` npm package — not `@react-native-firebase`) for Auth (email/password) and Firestore, chosen specifically so the app runs in Expo Go with no custom native code
- **i18next / react-i18next** for EN/BN translations, **date-fns** (with its `bn` locale) for date display
- **Jest** for unit tests; **Firebase Emulator + `@firebase/rules-unit-testing`** for security rules tests

## Data model (Firestore)

```
users/{uid}
  name, phone: string
  isManager: boolean
  locale: 'en' | 'bn'
  createdAt: number

mealDays/{date}/entries/{uid}      # one day-doc per date, one entry per member
  uid, date: string                 # sparse — only exists when something deviates from default
  noon, night: boolean              # true = that member's own slot is OFF
  noonGuests, nightGuests: number   # 0-5
  updatedAt: number

messCancellations/{date}
  date: string
  noon, night: boolean              # true = that slot is cancelled for everyone
  setBy: string                     # manager's uid
  updatedAt: number
```

Resolved meal count for any (member, date, slot) = mess-cancelled ? `0` : `(self-on ? 1 : 0) + guests`. This single formula (`src/utils/resolveMeal.ts`) drives the roster, the mess totals, and the personal month-to-date count, so they can never drift out of sync with each other.

## Security model

Enforced in `firestore.rules`, verified by `src/firebase/__tests__/rules.test.ts` (17 tests):

- **`users/{uid}`** — readable by any signed-in member (small, trusted group). No client can create/delete a profile, and the only field a member can update on their own doc is `locale` — never `isManager`, so no one can self-escalate to manager.
- **`mealDays/{date}/entries/{uid}`** — a member can only write their own entry, and each field (`noon`, `night`, `noonGuests`, `nightGuests`) is only writable if either its value is unchanged from what's already stored, or that field's slot cutoff (derived from the `{date}` path segment — not a client-supplied field, so it can't be spoofed) hasn't passed yet. Guest counts are range-checked to 0–5.
- **`messCancellations/{date}`** — writable only by a member whose profile has `isManager: true`, with no time restriction (the manager bypass).

## Project structure

```
app/                    expo-router screens (file-based routing)
  (auth)/login.tsx
  (tabs)/index.tsx       Dashboard
  (tabs)/planner.tsx     Meal Planner
  (tabs)/history.tsx
src/
  components/            ConfirmDialog, DayMealEditor, SlotRow, LanguageToggle, SignOutButton
  context/                AuthContext, LocaleContext
  hooks/                  Firestore data hooks (useOwnMealDays, useMessRoster, useMonthToDateCount, ...)
  firebase/               config.ts (SDK init), auth.ts, mealWrites.ts
  i18n/                   en.json, bn.json
  utils/                  cutoff.ts, resolveMeal.ts, guestCancelCheck.ts, buildHistoryRows.ts (+ tests)
firestore.rules           Security rules (see above)
firestore.indexes.json    Composite index for the per-member history query (collectionGroup on `entries`)
```

## Local setup

1. `npm install`
2. Copy `.env.example` → `.env`, fill in your Firebase **Web app** config (Project Settings → General → "Your apps" → Web) — not the iOS/Android native config files, those are for a different SDK.
3. `firebase use --add <your-project-id>` then `firebase deploy --only firestore:rules,firestore:indexes`
4. `npm start` → scan the QR with Expo Go on your phone (fastest way to test on a real device, no build needed)

## Testing

- `npm test` — unit tests (cutoff boundary logic to the second, guest-cancel branching, roster/month-count math, history attribution)
- `npm run test:rules` — spins up the Firestore emulator and runs the security rules tests

## Getting it onto a phone as a real installed app (not just Expo Go)

- **Android**: free. `eas build --platform android --profile preview` produces an installable APK, downloadable via a link from expo.dev — no Google account required.
- **iPhone**: Apple requires its own signing for *any* install beyond Expo Go, with no free-forever option:
  - Free path: build locally with Xcode, install via USB to your own device — expires every 7 days, no shareable link.
  - Paid path ($99/year Apple Developer Program): `eas build --platform ios --profile preview`, install via a link from expo.dev, no expiry, shareable with other mess members.
- This project is already linked to an EAS project (`app.json` → `extra.eas.projectId`) and has `bundleIdentifier` / `package` set, so both build commands above are ready to run once the above account decisions are made.
