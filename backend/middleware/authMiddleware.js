const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { readCookie, hasAllowedOrigin } = require('../utils/authCookies');

const protect = async (req, res, next) => {
  if (!hasAllowedOrigin(req)) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed' });
  }

  const token = readCookie(req, 'student_session');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error('JWT_SECRET must be configured before authenticating requests'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = await User.findById(decoded.id).select('+tokenVersion');
    if (!req.user || decoded.version !== req.user.tokenVersion) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' });
  }
};

module.exports = { protect };
