const express = require('express');
const router = express.Router();
const {
  checkSetupStatus,
  requestInitialAdminCode,
  verifyInitialAdminCode,
  setupAdminPassword,
  login,
  getMe,
  logout,
} = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/adminMiddleware');
const { adminSetupCodeLimiter, authLimiter } = require('../middleware/rateLimiters');
const { validateRequest } = require('../middleware/requestValidation');
const {
  adminSetupCodeRequestBody,
  adminSetupCompleteBody,
  loginBody,
  setPasswordBody,
  tokenParams,
} = require('../utils/requestSchemas');

router.get('/setup-status', authLimiter, checkSetupStatus);
router.post(
  '/setup',
  adminSetupCodeLimiter,
  validateRequest({ body: adminSetupCodeRequestBody }),
  requestInitialAdminCode
);
router.post(
  '/setup/verify',
  authLimiter,
  validateRequest({ body: adminSetupCompleteBody }),
  verifyInitialAdminCode
);
router.post(
  '/setup-password/:token',
  authLimiter,
  validateRequest({ params: tokenParams, body: setPasswordBody }),
  setupAdminPassword
);
router.post('/login', authLimiter, validateRequest({ body: loginBody }), login);
router.get('/me', protectAdmin, getMe);
router.post('/logout', protectAdmin, logout);

module.exports = router;
