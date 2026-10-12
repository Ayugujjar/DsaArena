const User = require('../models/User');
const { escapeRegex, parseBoundedInteger } = require('../utils/inputValidation');

/**
 * @route   GET /api/leaderboard
 * @desc    Get filtered leaderboard (overall, monthly, weekly, by batch, with search)
 * @access  Public
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { batch, timeframe = 'overall', search } = req.query;
    const pageNum = parseBoundedInteger(req.query.page, { fallback: 1, max: 10000 });
    const limitNum = parseBoundedInteger(req.query.limit, { fallback: 50, max: 100 });
    if (pageNum === null || limitNum === null ||
        !['overall', 'weekly', 'monthly'].includes(timeframe) ||
        (search !== undefined && (typeof search !== 'string' || search.length > 100)) ||
        (batch !== undefined && (typeof batch !== 'string' || batch.length > 100))) {
      return res.status(400).json({ success: false, message: 'Invalid leaderboard filters or pagination parameters' });
    }

    const query = { status: 'active' };

    // Batch filter
    if (batch && batch !== 'All') {
      query.batch = batch;
    }

    // Search by student name
    if (search && search.trim()) {
      query.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    // Sort key based on timeframe
    let sortKey = 'totalSolved';
    if (timeframe === 'weekly') {
      sortKey = 'weeklySolved';
    } else if (timeframe === 'monthly') {
      sortKey = 'monthlySolved';
    }

    const sortOption = {};
    sortOption[sortKey] = -1;
    sortOption['currentStreak'] = -1;

    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      User.find(query)
        .select(
          'name batch branch college leetcodeUsername gfgUsername leetcodeStats.totalSolved gfgStats.totalSolved totalSolved weeklySolved monthlySolved currentStreak longestStreak profileImage lastActive'
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Format rankings with ranks (1, 2, 3...)
    const rankedStudents = students.map((s, index) => ({
      rank: skip + index + 1,
      id: s._id,
      name: s.name,
      batch: s.batch,
      branch: s.branch,
      college: s.college,
      profileImage: s.profileImage,
      leetcodeUsername: s.leetcodeUsername || 'Not connected',
      gfgUsername: s.gfgUsername || 'Not connected',
      leetcodeSolved: s.leetcodeStats?.totalSolved || 0,
      gfgSolved: s.gfgStats?.totalSolved || 0,
      totalSolved: s.totalSolved || 0,
      weeklySolved: s.weeklySolved || 0,
      monthlySolved: s.monthlySolved || 0,
      streak: s.currentStreak || 0,
      longestStreak: s.longestStreak || 0,
      lastActive: s.lastActive,
    }));

    res.status(200).json({
      success: true,
      data: rankedStudents,
      timeframe,
      batch: batch || 'All',
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
};
