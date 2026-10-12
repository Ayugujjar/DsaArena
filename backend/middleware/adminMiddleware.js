const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { readCookie, hasAllowedOrigin } = require('../utils/authCookies');

const protectAdmin = async (req, res, next) => {
  if (!hasAllowedOrigin(req)) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed' });
  }

  const token = readCookie(req, 'admin_session');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin authorization token required' });
  }

  if (!process.env.ADMIN_JWT_SECRET) {
    return next(new Error('ADMIN_JWT_SECRET must be configured before authenticating requests'));
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET, { algorithms: ['HS256'] });
    req.admin = await Admin.findById(decoded.id).select('+tokenVersion');
    if (!req.admin || decoded.version !== req.admin.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Admin account not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
};

/**
 * Restricts access to Super Admin only.
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'Super Admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Super Admin privileges required' });
  }
};

/**
 * Restricts access to Super Admin or Admin (Moderator cannot modify data).
 */
const requireAdminOrAbove = (req, res, next) => {
  if (req.admin && (req.admin.role === 'Super Admin' || req.admin.role === 'Admin')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
  }
};

module.exports = {
  protectAdmin,
  requireSuperAdmin,
  requireAdminOrAbove,
};
