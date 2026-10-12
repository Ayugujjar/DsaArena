const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { validateRequest } = require('../middleware/requestValidation');
const { leaderboardQuery } = require('../utils/requestSchemas');

router.get('/', validateRequest({ query: leaderboardQuery }), getLeaderboard);

module.exports = router;
