import crypto from 'crypto';

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hashes an OTP string using SHA-256.
 */
export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

/**
 * Verifies if a given plain OTP matches a stored SHA-256 hash.
 */
export const verifyOTPHash = (plainOTP, storedHash) => {
  const inputHash = hashOTP(plainOTP);
  try {
    return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
};
