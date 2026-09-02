import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/en.json';
import bn from '@/i18n/bn.json';

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18next;
