import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en.json';
import translationAR from './locales/ar.json';

const resources = {
  en: {
    translation: translationEN
  },
  ar: {
    translation: translationAR
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: (() => { try { return localStorage.getItem('paperear_lang') || 'en' } catch { return 'en' } })(),
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

i18n.on('languageChanged', (lng) => { try { localStorage.setItem('paperear_lang', lng) } catch { } })

export default i18n;
