const express = require('express');
const router = express.Router();
const { getWeeklyReport, getMonthlyReport } = require('../controllers/reportController');
const { protectAdmin } = require('../middleware/adminMiddleware');
const { validateRequest } = require('../middleware/requestValidation');
const { monthlyReportQuery, weeklyReportQuery } = require('../utils/requestSchemas');

router.get('/weekly', validateRequest({ query: weeklyReportQuery }), protectAdmin, getWeeklyReport);
router.get('/monthly', validateRequest({ query: monthlyReportQuery }), protectAdmin, getMonthlyReport);

module.exports = router;
