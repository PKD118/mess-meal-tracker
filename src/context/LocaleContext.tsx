import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import type { Locale } from '@/types/models';

const STORAGE_KEY = 'locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const next = (stored === 'bn' ? 'bn' : 'en') as Locale;
      setLocaleState(next);
      i18n.changeLanguage(next);
    });
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await i18n.changeLanguage(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
