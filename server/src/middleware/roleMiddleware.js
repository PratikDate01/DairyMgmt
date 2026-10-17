/**
 * Role Authorization Middleware
 * Restricts access to specified roles.
 * @param {...string} allowedRoles - List of allowed roles (e.g. 'farmer', 'admin')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Authentication required.'
      });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role].filter(Boolean);
    const hasRole =
      allowedRoles.includes(req.user.role) ||
      allowedRoles.some((role) => userRoles.includes(role)) ||
      req.user.role === 'admin' ||
      userRoles.includes('admin');

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};
