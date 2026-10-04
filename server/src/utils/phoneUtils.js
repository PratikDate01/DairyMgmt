/**
 * Normalizes an Indian phone number to a standard 10-digit string.
 * Strips leading +91, 91, or 0 if present.
 * Returns normalized 10-digit string or null if invalid format.
 */
export const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return null;

  const cleaned = phone.trim().replace(/[\s\-()]/g, '');

  // Match +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX
  const match = cleaned.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);

  if (match) {
    return match[1];
  }

  return null;
};

/**
 * Normalizes a user identity input (either a 10-digit Indian mobile number or an email address).
 * Returns normalized string or null if neither format is valid.
 */
export const normalizeIdentity = (input) => {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Check if it's a valid email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // Fall back to phone normalization
  return normalizePhone(trimmed);
};
