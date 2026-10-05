import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * Protects routes by validating Bearer JWT in Authorization header.
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Token missing or malformed.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Token missing.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dairy_medical_system_super_secret_jwt_key_2026');

    req.user = {
      id: decoded.userId,
      role: decoded.activeRole || decoded.role,
      activeRole: decoded.activeRole || decoded.role,
      roles: decoded.roles || [decoded.role]
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Invalid token.'
    });
  }
};
