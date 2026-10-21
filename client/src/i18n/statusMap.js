import i18n from './index.js';

/**
 * Centralized status and enum translation helper.
 * Strictly preserves raw backend enum values and only returns localized display text.
 * Resilient against missing or inverted translation functions.
 */

/**
 * Safely resolves the translation function to use.
 * Prefers explicitly provided `t` (from useTranslation hook), falls back to singleton `i18n.t`.
 * @param {Function} [t]
 * @returns {Function|null}
 */
const resolveTranslateFn = (t) => {
  if (typeof t === 'function') {
    return t;
  }
  if (i18n && typeof i18n.t === 'function') {
    return (key, opts) => i18n.t(key, opts);
  }
  return null;
};

/**
 * Returns localized label for an internal backend status enum.
 * @param {string} status - Raw backend status enum (e.g., 'pending', 'under_observation', 'completed')
 * @param {Function} [t] - Optional i18next translation function (defaults to i18n.t)
 * @returns {string} Localized label or sanitized fallback
 */
export const getStatusLabel = (status, t) => {
  // Support accidental parameter swap: getStatusLabel(t, status)
  if (typeof status === 'function' && typeof t === 'string') {
    const temp = status;
    status = t;
    t = temp;
  }
  if (!status || typeof status !== 'string') return '';

  const key = `status.${status.toLowerCase()}`;
  const translate = resolveTranslateFn(t);

  if (translate) {
    try {
      const translated = translate(key);
      if (translated && translated !== key) {
        return translated;
      }
    } catch {
      // Graceful fallback below
    }
  }

  // Fallback to formatted readable string
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Returns localized label for an internal role identifier.
 * @param {string} role - Raw backend role string ('farmer', 'dairyOwner', 'medicalProvider', 'veterinarian', 'admin')
 * @param {Function} [t] - Optional i18next translation function (defaults to i18n.t)
 * @returns {string} Localized label or raw role
 */
export const getRoleLabel = (role, t) => {
  if (typeof role === 'function' && typeof t === 'string') {
    const temp = role;
    role = t;
    t = temp;
  }
  if (!role || typeof role !== 'string') return '';

  const key = `roles.${role}`;
  const translate = resolveTranslateFn(t);

  if (translate) {
    try {
      const translated = translate(key);
      if (translated && translated !== key) {
        return translated;
      }
    } catch {
      // Graceful fallback below
    }
  }

  const defaultLabels = {
    farmer: 'Farmer',
    dairyOwner: 'Dairy Owner',
    medicalProvider: 'Medical Store',
    veterinarian: 'Veterinarian',
    admin: 'Administrator'
  };
  return defaultLabels[role] || role;
};

/**
 * Returns localized label for a session enum ('morning' | 'evening')
 * @param {string} session - 'morning' | 'evening'
 * @param {Function} [t] - Optional i18next translation function (defaults to i18n.t)
 * @returns {string} Localized label or sanitized fallback
 */
export const getSessionLabel = (session, t) => {
  if (typeof session === 'function' && typeof t === 'string') {
    const temp = session;
    session = t;
    t = temp;
  }
  if (!session || typeof session !== 'string') return '';

  const key = `status.${session.toLowerCase()}`;
  const translate = resolveTranslateFn(t);

  if (translate) {
    try {
      const translated = translate(key);
      if (translated && translated !== key) {
        return translated;
      }
    } catch {
      // Graceful fallback below
    }
  }

  return session.charAt(0).toUpperCase() + session.slice(1);
};

/**
 * Returns localized label for payment methods ('cash' | 'bank_transfer' | 'upi' | 'cheque')
 * @param {string} method - 'cash' | 'bank_transfer' | 'upi' | 'cheque'
 * @param {Function} [t] - Optional i18next translation function (defaults to i18n.t)
 * @returns {string} Localized label or sanitized fallback
 */
export const getPaymentMethodLabel = (method, t) => {
  if (typeof method === 'function' && typeof t === 'string') {
    const temp = method;
    method = t;
    t = temp;
  }
  if (!method || typeof method !== 'string') return '';

  const key = `status.${method.toLowerCase()}`;
  const translate = resolveTranslateFn(t);

  if (translate) {
    try {
      const translated = translate(key);
      if (translated && translated !== key) {
        return translated;
      }
    } catch {
      // Graceful fallback below
    }
  }

  return method.replace(/_/g, ' ').toUpperCase();
};

/**
 * Returns localized label for cattle gender ('male' | 'female')
 * @param {string} gender - 'male' | 'female'
 * @param {Function} [t] - Optional i18next translation function (defaults to i18n.t)
 * @returns {string} Localized label or sanitized fallback
 */
export const getGenderLabel = (gender, t) => {
  if (typeof gender === 'function' && typeof t === 'string') {
    const temp = gender;
    gender = t;
    t = temp;
  }
  if (!gender || typeof gender !== 'string') return '';

  const key = `status.${gender.toLowerCase()}`;
  const translate = resolveTranslateFn(t);

  if (translate) {
    try {
      const translated = translate(key);
      if (translated && translated !== key) {
        return translated;
      }
    } catch {
      // Graceful fallback below
    }
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

/**
 * Returns localized label for risk levels ('low' | 'moderate' | 'high' | 'critical')
 * @param {string} risk - 'low' | 'moderate' | 'high' | 'critical'
 * @param {Function} [t] - Optional i18next translation function (defaults to i18n.t)
 * @returns {string} Localized label or sanitized fallback
 */
export const getRiskLabel = (risk, t) => {
  if (typeof risk === 'function' && typeof t === 'string') {
    const temp = risk;
    risk = t;
    t = temp;
  }
  if (!risk || typeof risk !== 'string') return '';

  const key = `status.${risk.toLowerCase()}`;
  const translate = resolveTranslateFn(t);

  if (translate) {
    try {
      const translated = translate(key);
      if (translated && translated !== key) {
        return translated;
      }
    } catch {
      // Graceful fallback below
    }
  }

  return risk.charAt(0).toUpperCase() + risk.slice(1);
};

/**
 * Returns localized label for animal type ('cow' | 'buffalo' | 'bull' | 'ox' | 'calf')
 * @param {string} type - 'cow' | 'buffalo'
 * @param {Function} [t] - Optional i18next translation function
 * @returns {string} Localized animal type
 */
export const getAnimalTypeLabel = (type, t) => {
  if (typeof type === 'function' && typeof t === 'string') {
    const temp = type;
    type = t;
    t = temp;
  }
  if (!type || typeof type !== 'string') return '';

  const lower = type.toLowerCase().trim();
  const key = `status.${lower}`;
  const translate = resolveTranslateFn(t);

  if (translate) {
    try {
      const translated = translate(key);
      if (translated && translated !== key) {
        return translated;
      }
    } catch {
      // Fallback
    }
  }

  const map = {
    cow: 'Cow',
    buffalo: 'Buffalo',
    bull: 'Bull',
    ox: 'Ox',
    calf: 'Calf'
  };

  const currentLang = (typeof i18n !== 'undefined' && i18n?.language) ? i18n.language : 'en';
  if (currentLang === 'mr') {
    const mrMap = {
      cow: 'गाय',
      buffalo: 'म्हैस',
      bull: 'बैल',
      ox: 'बैल',
      calf: 'वासरू'
    };
    if (mrMap[lower]) return mrMap[lower];
  }

  return map[lower] || type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Returns localized label for known screening/diagnostic conditions and diseases.
 * Preserves raw clinical diagnosis/free-text for unrecognized strings.
 * @param {string} disease - Predefined enum or free-text condition
 * @param {Function} [t] - Optional translation function
 * @returns {string} Localized disease label or original text
 */
export const getDiseaseLabel = (disease, t) => {
  if (typeof disease === 'function' && typeof t === 'string') {
    const temp = disease;
    disease = t;
    t = temp;
  }
  if (!disease || typeof disease !== 'string') return '';

  const translate = resolveTranslateFn(t);
  const lower = disease.toLowerCase().trim();

  // Known conditions mapping for exact bilingual coverage
  const mrDiseaseMap = {
    'possible bovine mastitis (initial screening)': 'संभाव्य गोवंशीय स्तनदाह (प्राथमिक तपासणी)',
    'bovine mastitis': 'गोवंशीय स्तनदाह',
    'mastitis': 'स्तनदाह (मॅस्टायटिस)',
    'acute mastitis': 'तीव्र स्तनदाह',
    'lumpy skin disease (lsd) screening alert': 'लम्पी त्वचा रोग (LSD) पूर्वसूचना',
    'lumpy skin disease': 'लम्पी त्वचा रोग (LSD)',
    'lumpy skin': 'लम्पी त्वचा रोग',
    'bovine foot rot / pododermatitis': 'गोवंशीय खुरकुज / पोडोडरमॅटायटिस',
    'foot and mouth disease': 'लाळ खुरकूत (FMD)',
    'foot and mouth disease (fmd)': 'लाळ खुरकूत (FMD)',
    'foot & mouth disease': 'लाळ खुरकूत (FMD)',
    'fungal ringworm / dermatophytosis': 'बुरशीजन्य गजकर्ण / डर्मेटोफायटोसिस',
    'possible bovine dermatitis / skin condition': 'संभाव्य गोवंशीय त्वचा विकार',
    'general livestock health assessment required': 'सर्वसाधारण पशु आरोग्य तपासणी आवश्यक',
    'healthy': 'निरोगी'
  };

  const enDiseaseMap = {
    'possible bovine mastitis (initial screening)': 'Possible Bovine Mastitis (Initial Screening)',
    'bovine mastitis': 'Bovine Mastitis',
    'mastitis': 'Mastitis',
    'acute mastitis': 'Acute Mastitis',
    'lumpy skin disease (lsd) screening alert': 'Lumpy Skin Disease (LSD) Alert',
    'lumpy skin disease': 'Lumpy Skin Disease (LSD)',
    'lumpy skin': 'Lumpy Skin Disease',
    'bovine foot rot / pododermatitis': 'Bovine Foot Rot / Pododermatitis',
    'foot and mouth disease': 'Foot and Mouth Disease (FMD)',
    'foot and mouth disease (fmd)': 'Foot and Mouth Disease (FMD)',
    'foot & mouth disease': 'Foot & Mouth Disease (FMD)',
    'fungal ringworm / dermatophytosis': 'Fungal Ringworm / Dermatophytosis',
    'possible bovine dermatitis / skin condition': 'Possible Bovine Dermatitis / Skin Condition',
    'general livestock health assessment required': 'General Livestock Health Assessment Required',
    'healthy': 'Healthy'
  };

  const currentLang = (typeof i18n !== 'undefined' && i18n?.language) ? i18n.language : 'en';

  if (translate) {
    const cleanKey = lower.replace(/[^a-z0-9]/g, '_');
    const i18nKey = `diseases.${cleanKey}`;
    try {
      const translated = translate(i18nKey);
      if (translated && translated !== i18nKey) {
        return translated;
      }
    } catch {
      // Fallback to dictionary
    }
  }

  if (currentLang === 'mr' && mrDiseaseMap[lower]) {
    return mrDiseaseMap[lower];
  } else if (currentLang === 'en' && enDiseaseMap[lower]) {
    return enDiseaseMap[lower];
  }

  // Preserve original free-text or AI diagnosis
  return disease;
};


