const User = require('../models/User');
const DailyProgress = require('../models/DailyProgress');
const ProblemActivity = require('../models/ProblemActivity');
const { parseBoundedInteger } = require('../utils/inputValidation');
const { getTodayString, getPastDates, formatDate } = require('../utils/dateUtils');

/**
 * @route   GET /api/progress/me
 * @desc    Get current student's full dashboard analytics
 * @access  Private (Student)
 */
const getMyProgress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const todayStr = getTodayString();
    const [allProgress, platformActivities] = await Promise.all([
      DailyProgress.find({ userId: user._id }).select('date gfgSolved').lean(),
      ProblemActivity.find({
        userId: user._id,
        platform: { $in: ['LeetCode', 'GeeksforGeeks'] },
      }).select('platform solvedAt').lean(),
    ]);
    const dailySolvedMap = {};
    const leetcodeActivityMap = {};
    const gfgActivityMap = {};
    platformActivities.forEach((activity) => {
      if (!activity.solvedAt || Number.isNaN(new Date(activity.solvedAt).getTime())) return;
      const date = formatDate(activity.solvedAt);
      const activityMap = activity.platform === 'LeetCode' ? leetcodeActivityMap : gfgActivityMap;
      activityMap[date] = (activityMap[date] || 0) + 1;
    });

    const hasGfgActivityHistory = platformActivities.some((activity) => activity.platform === 'GeeksforGeeks');
    if (!hasGfgActivityHistory) {
      allProgress.forEach((record) => {
        dailySolvedMap[record.date] = record.gfgSolved || 0;
      });
    }
    [leetcodeActivityMap, gfgActivityMap].forEach((activityMap) => {
      Object.entries(activityMap).forEach(([date, solved]) => {
        dailySolvedMap[date] = (dailySolvedMap[date] || 0) + solved;
      });
    });

    // 1. Weekly progress (past 7 days with day labels Mon-Sun)
    const past7Dates = getPastDates(7);
    const weeklySolved = past7Dates.reduce((sum, date) => sum + (dailySolvedMap[date] || 0), 0);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyChart = past7Dates.map((dateStr) => {
      const d = new Date(dateStr);
      return {
        date: dateStr,
        day: daysOfWeek[d.getDay()],
        solved: dailySolvedMap[dateStr] || 0,
      };
    });

    // 2. Monthly progress (past 30 days)
    const past30Dates = getPastDates(30);
    const monthlySolved = past30Dates.reduce((sum, date) => sum + (dailySolvedMap[date] || 0), 0);

    const monthlyChart = past30Dates.map((dateStr) => ({
      date: dateStr,
      solved: dailySolvedMap[dateStr] || 0,
    }));

    // 3. Platform comparison
    const platformComparison = [
      { name: 'LeetCode', value: user.leetcodeStats?.totalSolved || 0, color: '#f59e0b' },
      { name: 'GeeksforGeeks', value: user.gfgStats?.totalSolved || 0, color: '#10b981' },
    ];

    // 4. Difficulty distribution
    const difficultyDistribution = [
      { difficulty: 'Easy', count: user.easySolved || 0, color: '#00b8a3' },
      { difficulty: 'Medium', count: user.mediumSolved || 0, color: '#ffc01e' },
      { difficulty: 'Hard', count: user.hardSolved || 0, color: '#ff375f' },
      {
        difficulty: 'GFG Basic/School',
        count: (user.gfgStats?.basicSolved || 0) + (user.gfgStats?.schoolSolved || 0),
        color: '#6366f1',
      },
    ];

    // 5. Recent problem activity (last 10)
    const recentActivity = await ProblemActivity.find({ userId: user._id })
      .sort({ solvedAt: -1 })
      .limit(10);

    // 6. Contribution calendar data for the entire year / all records
    const contributionMap = {};
    Object.entries(dailySolvedMap).forEach(([date, solved]) => {
      if (solved > 0) contributionMap[date] = solved;
    });

    // 7. Today's breakdown
    const todayDoc = await DailyProgress.findOne({ userId: user._id, date: todayStr });
    const todayLeetCodeSolved = leetcodeActivityMap[todayStr] || 0;
    const todayGfgSolved = hasGfgActivityHistory
      ? gfgActivityMap[todayStr] || 0
      : todayDoc?.gfgSolved || 0;
    const todayBreakdown = {
      date: todayStr,
      total: todayLeetCodeSolved + todayGfgSolved,
      leetcode: todayLeetCodeSolved,
      gfg: todayGfgSolved,
    };

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalSolved: user.totalSolved,
        dailySolved: todayBreakdown.total,
        weeklySolved,
        monthlySolved,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActive: user.lastActive,
      },
      charts: {
        weeklyChart,
        monthlyChart,
        platformComparison,
        difficultyDistribution,
        contributionMap,
      },
      todayBreakdown,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/progress/activity
 * @desc    Get paginated problem activity history
 * @access  Private (Student)
 */
const getActivityHistory = async (req, res, next) => {
  try {
    const page = parseBoundedInteger(req.query.page, { fallback: 1, max: 10000 });
    const limit = parseBoundedInteger(req.query.limit, { fallback: 20, max: 100 });
    const platform = req.query.platform;
    if (page === null || limit === null ||
        (platform !== undefined && !['All', 'LeetCode', 'GeeksforGeeks'].includes(platform))) {
      return res.status(400).json({ success: false, message: 'Invalid activity filters or pagination parameters' });
    }
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (platform && platform !== 'All') {
      query.platform = platform;
    }

    const [activities, total] = await Promise.all([
      ProblemActivity.find(query).sort({ solvedAt: -1 }).skip(skip).limit(limit),
      ProblemActivity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      activities,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProgress,
  getActivityHistory,
};
