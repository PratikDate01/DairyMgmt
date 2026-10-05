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
 * @route POST /api/auth/check-email
 * @desc Check if an email/identity exists and return its registered roles
 */
export const checkEmail = async (req, res) => {
  try {
    const rawInput = req.body.email || req.body.phone || req.body.identity;

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        message: 'Email address or phone number is required'
      });
    }

    const normalizedIdentity = normalizeIdentity(rawInput);
    if (!normalizedIdentity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address or 10-digit Indian mobile number'
      });
    }

    const user = await User.findOne({
      $or: [{ phone: normalizedIdentity }, { email: normalizedIdentity }]
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        exists: false,
        roles: []
      });
    }

    const roles = user.roles && user.roles.length > 0 ? user.roles : [user.role || 'farmer'];

    return res.status(200).json({
      success: true,
      exists: true,
      name: user.name,
      roles: roles
    });
  } catch (error) {
    console.error(`Check Email Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while checking email account'
    });
  }
};

/**
 * @route POST /api/auth/register
 * @desc Request registration for a new user account or role. DOES NOT write to User collection until OTP is verified.
 */
export const register = async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;
    const rawInput = phone || email;

    if (!name || !rawInput || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email/phone number, and role are required'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    const validRoles = ['farmer', 'dairyOwner', 'medicalProvider', 'veterinarian'];
    if (!validRoles.includes(role)) {
      if (role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin registration is restricted.'
        });
      }
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
      const currentRoles = existingUser.roles && existingUser.roles.length > 0 ? existingUser.roles : [existingUser.role || 'farmer'];

      if (currentRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Your account is already registered as a ${getRoleLabel(role)}. Please log in and select your role.`
        });
      }
    }

    // Check resend cooldown on existing active registration OTP
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

    // Invalidate any previous OTPs for this identity
    await OTP.deleteMany({ phone: normalizedIdentity });

    // Generate new OTP
    const plainOTP = generateOTP();
    const otpHash = hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Save OTP with pending registration metadata (DO NOT touch User model here!)
    await OTP.create({
      phone: normalizedIdentity,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
      verified: false,
      isRegistration: true,
      pendingName: name.trim(),
      pendingRole: role
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
        await OTP.deleteMany({ phone: normalizedIdentity });
        return res.status(502).json({
          success: false,
          message: 'Unable to send OTP. Please try again.'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'OTP sent to your email. Verify OTP to complete registration.'
      });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      const masked = normalizedIdentity.slice(0, 6).replace(/./g, '*') + normalizedIdentity.slice(6);
      console.log(`[DEV OTP] Registration OTP generated for ${masked}: ${plainOTP}`);
    }

    const responsePayload = {
      success: true,
      message: 'OTP sent. Verify OTP to complete registration.'
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
 * @desc Request a 6-digit OTP for login, validating selected active role
 */
export const requestOTP = async (req, res) => {
  try {
    const rawInput = req.body.phone || req.body.email;
    const requestedRole = req.body.role;

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

    // Check if user exists
    const user = await User.findOne({
      $or: [{ phone: normalizedIdentity }, { email: normalizedIdentity }]
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found for this mobile number or email address'
      });
    }

    if (user.isActive !== true) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.'
      });
    }

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role || 'farmer'];

    let activeRole = requestedRole;
    if (requestedRole) {
      if (!userRoles.includes(requestedRole)) {
        return res.status(403).json({
          success: false,
          message: `Your account is not registered for the '${getRoleLabel(requestedRole)}' role.`
        });
      }
    } else {
      if (userRoles.length === 1) {
        activeRole = userRoles[0];
      } else {
        return res.status(400).json({
          success: false,
          message: 'Multiple roles registered. Please select a role before requesting OTP.'
        });
      }
    }

    // Check resend cooldown
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

    // Invalidate previous active OTPs
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
      verified: false,
      isRegistration: false
    });

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
 * @desc Verify OTP, create or update user if registration OTP, generate JWT with activeRole, and return session
 */
export const verifyOTP = async (req, res) => {
  try {
    const { phone, email, otp, role } = req.body;
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

    const otpRecord = await OTP.findOne({ phone: normalizedIdentity, verified: false });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP found. Please request a new OTP.'
      });
    }

    if (Date.now() > otpRecord.expiresAt.getTime()) {
      await OTP.deleteMany({ phone: normalizedIdentity });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await OTP.deleteMany({ phone: normalizedIdentity });
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
      });
    }

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

    // OTP Verified Successfully!
    let user = null;
    let activeRole = role || otpRecord.pendingRole;

    if (otpRecord.isRegistration) {
      // IF REGISTRATION OTP: Create new User OR append role to existing User NOW
      let existingUser = await User.findOne({
        $or: [{ phone: normalizedIdentity }, { email: normalizedIdentity }]
      });

      const pendingRole = otpRecord.pendingRole || 'farmer';
      const pendingName = otpRecord.pendingName || 'User';

      if (existingUser) {
        const currentRoles = existingUser.roles && existingUser.roles.length > 0 ? existingUser.roles : [existingUser.role || 'farmer'];
        existingUser.roles = Array.from(new Set([...currentRoles, pendingRole]));
        existingUser.role = pendingRole;
        if (pendingName) existingUser.name = pendingName;
        user = await existingUser.save();
      } else {
        const userData = {
          name: pendingName,
          phone: normalizedIdentity,
          role: pendingRole,
          roles: [pendingRole],
          isActive: true
        };
        if (isValidEmail(normalizedIdentity)) {
          userData.email = normalizedIdentity;
        }
        user = await User.create(userData);
      }
      activeRole = pendingRole;
    } else {
      // IF LOGIN OTP: Find existing User
      user = await User.findOne({
        $or: [{ phone: normalizedIdentity }, { email: normalizedIdentity }]
      });

      if (!user) {
        await OTP.deleteMany({ phone: normalizedIdentity });
        return res.status(404).json({
          success: false,
          message: 'User account not found. Please register first.'
        });
      }
    }

    if (user.isActive !== true) {
      await OTP.deleteMany({ phone: normalizedIdentity });
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.'
      });
    }

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role || 'farmer'];
    
    if (!activeRole) {
      activeRole = userRoles[0];
    }

    if (!userRoles.includes(activeRole)) {
      await OTP.deleteMany({ phone: normalizedIdentity });
      return res.status(403).json({
        success: false,
        message: `Your account is not authorized for the '${getRoleLabel(activeRole)}' role.`
      });
    }

    // Invalidate OTP record after successful processing
    await OTP.deleteMany({ phone: normalizedIdentity });

    const jwtSecret = process.env.JWT_SECRET || 'dairy_medical_system_super_secret_jwt_key_2026';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: activeRole,
        activeRole: activeRole,
        roles: userRoles
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return res.status(200).json({
      success: true,
      message: 'Account verified and logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: activeRole,
        activeRole: activeRole,
        roles: userRoles,
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

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role || 'farmer'];
    const activeRole = req.user.activeRole || req.user.role || userRoles[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: activeRole,
        activeRole: activeRole,
        roles: userRoles,
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

/**
 * Helper to display human-readable role label
 */
function getRoleLabel(roleKey) {
  const map = {
    farmer: 'Farmer',
    dairyOwner: 'Dairy Owner',
    medicalProvider: 'Medical Provider',
    veterinarian: 'Veterinarian',
    admin: 'Administrator'
  };
  return map[roleKey] || roleKey;
}
