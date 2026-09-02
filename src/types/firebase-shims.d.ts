// @firebase/auth's package.json exports map resolves the `types` condition
// before the `react-native` branch, so TypeScript sees auth-public.d.ts
// (the generic surface) instead of dist/rn/index.rn.d.ts — even though Metro
// correctly bundles the react-native build at runtime, which does export
// this. This augmentation fills in the type that's genuinely present at
// runtime but invisible to tsc's package-exports resolution.
// The `export {}` marks this file as a module, which makes the `declare
// module` block below an AUGMENTATION (merged with the real module) instead
// of a full replacement of it.
export {};

declare module '@firebase/auth' {
  import type { Persistence } from '@firebase/auth';

  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
