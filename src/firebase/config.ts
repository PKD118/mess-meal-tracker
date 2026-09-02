import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// 'firebase/auth' (the top-level wrapper) has no `react-native` branch in its
// export map, so getReactNativePersistence isn't reachable through it. Import
// from the underlying '@firebase/auth' package instead, which does — keeping
// every auth import on the same resolved bundle avoids cross-build mismatches.
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from '@firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  throw new Error(
    'Missing Firebase config. Copy .env.example to .env and fill in your Firebase project values.'
  );
}

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws if the app was already initialized (e.g. Fast Refresh).
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db: Firestore = getFirestore(app);
export default app;
