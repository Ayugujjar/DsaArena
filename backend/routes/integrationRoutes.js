const express = require('express');
const router = express.Router();
const {
  connectLeetCode,
  connectGFG,
  disconnectPlatform,
  syncNow,
  syncLeetCode,
  syncGFG,
} = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/requestValidation');
const { syncLimiter, platformLimiter } = require('../middleware/rateLimiters');
const { connectPlatformBody, disconnectBody } = require('../utils/requestSchemas');

router.post('/leetcode/connect', platformLimiter, validateRequest({ body: connectPlatformBody }), protect, connectLeetCode);
router.post('/gfg/connect', platformLimiter, validateRequest({ body: connectPlatformBody }), protect, connectGFG);
router.post('/disconnect', platformLimiter, validateRequest({ body: disconnectBody }), protect, disconnectPlatform);
router.post('/sync', protect, syncLimiter, syncNow);
router.post('/leetcode/sync', protect, syncLimiter, syncLeetCode);
router.post('/gfg/sync', protect, syncLimiter, syncGFG);

module.exports = router;
