const express = require('express');
const router = express.Router();
const { getMyProgress, getActivityHistory } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/requestValidation');
const { progressQuery } = require('../utils/requestSchemas');

router.get('/me', protect, getMyProgress);
router.get('/activity', validateRequest({ query: progressQuery }), protect, getActivityHistory);

module.exports = router;
