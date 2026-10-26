import i18next from 'i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

export const defaultNS = 'translation';
export const resources = {
  en: { translation: en },
  hi: { translation: hi },
} as const;

export const initI18n = (initialLang: 'en' | 'hi' | 'mr' = 'en') => {
  if (!i18next.isInitialized) {
    i18next.init({
      compatibilityJSON: 'v3',
      lng: initialLang,
      fallbackLng: 'en',
      resources,
      interpolation: {
        escapeValue: false,
      },
    });
  }
  return i18next;
};

export default i18next;
