const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication routes (login, register, forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// Dedicated rate limiter for manual platform synchronization
const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Sync rate limit exceeded. Please wait a few minutes before synchronizing again.',
  },
});

const platformLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many platform connection changes. Please try again later.',
  },
});

const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many administrator requests. Please try again later.',
  },
});

// Rate limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please check your inbox or try again in 15 minutes.',
  },
});

const adminSetupCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many administrator setup code requests. Please try again in 15 minutes.',
  },
});

module.exports = {
  authLimiter,
  syncLimiter,
  platformLimiter,
  adminApiLimiter,
  passwordResetLimiter,
  adminSetupCodeLimiter,
};
