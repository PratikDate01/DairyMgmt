import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { normalizePhone, normalizeIdentity } from '../utils/phoneUtils.js';
import { generateOTP, hashOTP, verifyOTPHash } from '../utils/otpUtils.js';
import { sendOtpEmail, isValidEmail } from '../services/emailService.js';

const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * @route POST /api/auth/register
 * @desc Register a new user account and send initial OTP
 */
export const register = async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;
    const rawInput = phone || email;

    if (!name || !rawInput || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number or email address, and role are required'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    const validRoles = ['farmer', 'dairyOwner', 'medicalProvider', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role selected'
      });
    }

    const normalizedIdentity = normalizeIdentity(rawInput);
    if (!normalizedIdentity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number or email address'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ phone: normalizedIdentity }, { email: normalizedIdentity }]
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this mobile number or email address already exists. Please log in.'
      });
    }

    // Create new user account
    const userData = {
      name: name.trim(),
      phone: normalizedIdentity,
      role,
      isActive: true
    };
    if (isValidEmail(normalizedIdentity)) {
      userData.email = normalizedIdentity;
    }

    const newUser = await User.create(userData);

    // Invalidate any previous OTPs for this identity
    await OTP.deleteMany({ phone: normalizedIdentity });

    // Generate new OTP
    const plainOTP = generateOTP();
    const otpHash = hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await OTP.create({
      phone: normalizedIdentity,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
      verified: false
    });

    const emailProvider = process.env.EMAIL_PROVIDER;

    if (emailProvider === 'brevo') {
      let recipientEmail = null;
      if (isValidEmail(normalizedIdentity)) {
        recipientEmail = normalizedIdentity;
      } else if (email && isValidEmail(email)) {
        recipientEmail = email.trim().toLowerCase();
      }

      if (!recipientEmail) {
        await User.findByIdAndDelete(newUser._id);
        await OTP.deleteMany({ phone: normalizedIdentity });
        return res.status(400).json({
          success: false,
          message: 'A valid email address is required for registration when email OTP is active'
        });
      }

      try {
        await sendOtpEmail({
          to: recipientEmail,
          otp: plainOTP,
          expiresInMinutes: 5
        });
      } catch (deliveryError) {
        console.error(`Register Email Delivery Error: ${deliveryError.message}`);
        await User.findByIdAndDelete(newUser._id);
        await OTP.deleteMany({ phone: normalizedIdentity });
        return res.status(502).json({
          success: false,
          message: 'Unable to send OTP. Please try again.'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully! OTP sent.'
      });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      const masked = normalizedIdentity.slice(0, 6).replace(/./g, '*') + normalizedIdentity.slice(6);
      console.log(`[DEV OTP] Registration OTP generated for ${masked}: ${plainOTP}`);
    }

    const responsePayload = {
      success: true,
      message: 'Account registered successfully! OTP sent.'
    };

    if (isDev) {
      responsePayload.devOtp = plainOTP;
    }

    return res.status(201).json(responsePayload);

  } catch (error) {
    console.error(`Register Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while registering account'
    });
  }
};

/**
 * @route POST /api/auth/request-otp
 * @desc Request a 6-digit OTP for login
 */
export const requestOTP = async (req, res) => {
  try {
    const rawInput = req.body.phone || req.body.email;

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        message: 'Phone number or email address is required'
      });
    }

    const normalizedIdentity = normalizeIdentity(rawInput);
    if (!normalizedIdentity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number or email address'
      });
    }

    // Step 1: Check if user exists in database
    const user = await User.findOne({
      $or: [{ phone: normalizedIdentity }, { email: normalizedIdentity }]
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found for this mobile number or email address'
      });
    }

    // Step 2: Check resend cooldown on existing active OTP
    const existingOTP = await OTP.findOne({ phone: normalizedIdentity, verified: false });
    if (existingOTP) {
      const timeElapsed = Date.now() - existingOTP.lastSentAt.getTime();
      if (timeElapsed < RESEND_COOLDOWN_MS) {
        const secondsRemaining = Math.ceil((RESEND_COOLDOWN_MS - timeElapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsRemaining} seconds before requesting a new OTP`
        });
      }
    }

    // Step 3: Invalidate previous active OTPs for this identity
    await OTP.deleteMany({ phone: normalizedIdentity });

    // Step 4: Generate new OTP and hash it
    const plainOTP = generateOTP();
    const otpHash = hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Step 5: Save new OTP record
    await OTP.create({
      phone: normalizedIdentity,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
      verified: false
    });

    // Step 6: Delivery via Brevo or Dev Fallback
    const emailProvider = process.env.EMAIL_PROVIDER;

    if (emailProvider === 'brevo') {
      let recipientEmail = null;
      if (isValidEmail(normalizedIdentity)) {
        recipientEmail = normalizedIdentity;
      } else if (user && user.email && isValidEmail(user.email)) {
        recipientEmail = user.email;
      }

      if (!recipientEmail) {
        await OTP.deleteMany({ phone: normalizedIdentity });
        return res.status(400).json({
          success: false,
          message: 'No valid email address associated with this account for email OTP delivery'
        });
      }

      try {
        await sendOtpEmail({
          to: recipientEmail,
          otp: plainOTP,
          expiresInMinutes: 5
        });
      } catch (deliveryError) {
        console.error(`Request OTP Email Delivery Error: ${deliveryError.message}`);
        await OTP.deleteMany({ phone: normalizedIdentity });
        return res.status(502).json({
          success: false,
          message: 'Unable to send OTP. Please try again.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully.'
      });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      const masked = normalizedIdentity.slice(0, 6).replace(/./g, '*') + normalizedIdentity.slice(6);
      console.log(`[DEV OTP] OTP generated for ${masked}: ${plainOTP}`);
    }

    const responsePayload = {
      success: true,
      message: 'OTP sent successfully'
    };

    if (isDev) {
      responsePayload.devOtp = plainOTP;
    }

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error(`Request OTP Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while requesting OTP'
    });
  }
};

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP, check account status, generate JWT, and return session
 */
export const verifyOTP = async (req, res) => {
  try {
    const { phone, email, otp } = req.body;
    const rawInput = phone || email;

    if (!rawInput || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number or email and OTP are required'
      });
    }

    const normalizedIdentity = normalizeIdentity(rawInput);
    if (!normalizedIdentity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number or email address'
      });
    }

    // Find active OTP record
    const otpRecord = await OTP.findOne({ phone: normalizedIdentity, verified: false });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP found. Please request a new OTP.'
      });
    }

    // Check expiration
    if (Date.now() > otpRecord.expiresAt.getTime()) {
      await OTP.deleteMany({ phone: normalizedIdentity });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check attempt limit
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await OTP.deleteMany({ phone: normalizedIdentity });
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP Hash
    const isMatch = verifyOTPHash(otp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const attemptsLeft = MAX_ATTEMPTS - otpRecord.attempts;

      if (attemptsLeft <= 0) {
        await OTP.deleteMany({ phone: normalizedIdentity });
        return res.status(400).json({
          success: false,
          message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`
      });
    }

    // OTP Verified Successfully -> Invalidate OTP record
    await OTP.deleteMany({ phone: normalizedIdentity });

    // Fetch User details
    const user = await User.findOne({
      $or: [{ phone: normalizedIdentity }, { email: normalizedIdentity }]
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Check if user account is active
    if (user.isActive !== true) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.'
      });
    }

    // Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'dairy_medical_system_super_secret_jwt_key_2026';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error(`Verify OTP Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying OTP'
    });
  }
};

/**
 * @route GET /api/auth/me
 * @desc Get currently authenticated user identity
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isActive !== true) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error(`GetMe Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user profile'
    });
  }
};
