import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translation namespaces
import enCommon from './locales/en/common.json' with { type: 'json' };
import enAuth from './locales/en/auth.json' with { type: 'json' };
import enFarmer from './locales/en/farmer.json' with { type: 'json' };
import enDairyOwner from './locales/en/dairyOwner.json' with { type: 'json' };
import enVeterinarian from './locales/en/veterinarian.json' with { type: 'json' };
import enMedicalProvider from './locales/en/medicalProvider.json' with { type: 'json' };
import enAdmin from './locales/en/admin.json' with { type: 'json' };
import enComplaints from './locales/en/complaints.json' with { type: 'json' };
import enValidation from './locales/en/validation.json' with { type: 'json' };

// Marathi translation namespaces
import mrCommon from './locales/mr/common.json' with { type: 'json' };
import mrAuth from './locales/mr/auth.json' with { type: 'json' };
import mrFarmer from './locales/mr/farmer.json' with { type: 'json' };
import mrDairyOwner from './locales/mr/dairyOwner.json' with { type: 'json' };
import mrVeterinarian from './locales/mr/veterinarian.json' with { type: 'json' };
import mrMedicalProvider from './locales/mr/medicalProvider.json' with { type: 'json' };
import mrAdmin from './locales/mr/admin.json' with { type: 'json' };
import mrComplaints from './locales/mr/complaints.json' with { type: 'json' };
import mrValidation from './locales/mr/validation.json' with { type: 'json' };

export const LANGUAGE_STORAGE_KEY = 'gauseva_language';
export const SUPPORTED_LANGUAGES = ['en', 'mr'];

// Determine initial language from localStorage or default to English
const getInitialLanguage = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        return saved;
      }
    }
  } catch (e) {
    console.warn('Could not read language from localStorage:', e);
  }
  return 'en';
};

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    farmer: enFarmer,
    dairyOwner: enDairyOwner,
    veterinarian: enVeterinarian,
    medicalProvider: enMedicalProvider,
    admin: enAdmin,
    complaints: enComplaints,
    validation: enValidation
  },
  mr: {
    common: mrCommon,
    auth: mrAuth,
    farmer: mrFarmer,
    dairyOwner: mrDairyOwner,
    veterinarian: mrVeterinarian,
    medicalProvider: mrMedicalProvider,
    admin: mrAdmin,
    complaints: mrComplaints,
    validation: mrValidation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    ns: ['common', 'auth', 'farmer', 'dairyOwner', 'veterinarian', 'medicalProvider', 'admin', 'complaints', 'validation'],
    defaultNS: 'common',
    fallbackNS: 'common',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // Prevents suspense flashes
    }
  });

/**
 * Change the active application language and persist it to localStorage
 * @param {('en'|'mr')} lng 
 */
export const changeAppLanguage = (lng) => {
  const targetLng = SUPPORTED_LANGUAGES.includes(lng) ? lng : 'en';
  i18n.changeLanguage(targetLng);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, targetLng);
    }
  } catch (e) {
    console.warn('Could not save language to localStorage:', e);
  }
};

export default i18n;
