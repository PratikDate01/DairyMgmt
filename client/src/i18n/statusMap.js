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

