const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/requestValidation');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');
const { emailBody, loginBody, registerBody, setPasswordBody, tokenParams } = require('../utils/requestSchemas');

router.post('/register', authLimiter, validateRequest({ body: registerBody }), register);
router.post('/login', authLimiter, validateRequest({ body: loginBody }), login);
router.post('/forgot-password', passwordResetLimiter, validateRequest({ body: emailBody }), forgotPassword);
router.post(
  '/reset-password/:token',
  passwordResetLimiter,
  validateRequest({ params: tokenParams, body: setPasswordBody }),
  resetPassword
);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
