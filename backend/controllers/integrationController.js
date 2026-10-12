const User = require('../models/User');
const leetcodeService = require('../services/leetcodeService');
const gfgService = require('../services/gfgService');
const progressService = require('../services/progressService');

/**
 * @route   POST /api/integrations/leetcode/connect
 * @desc    Connect or update LeetCode account & perform initial baseline sync
 * @access  Private (Student)
 */
const connectLeetCode = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ success: false, message: 'LeetCode username is required' });
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_-]{1,39}$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'LeetCode username contains invalid characters' });
    }
    const user = await User.findById(req.user._id);

    // Initial check
    const result = await leetcodeService.fetchUserProfile(cleanUsername);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'LeetCode user not found. Please verify the username or check privacy settings.',
      });
    }

    user.leetcodeUsername = cleanUsername;
    user.leetcodeConnected = true;
    user.leetcodeSyncStatus = 'success';
    user.leetcodeLastSynced = new Date();
    user.leetcodeLastError = '';
    user.leetcodeStats = {
      totalSolved: result.totalSolved,
      easySolved: result.easySolved,
      mediumSolved: result.mediumSolved,
      hardSolved: result.hardSolved,
      ranking: result.ranking,
      acceptanceRate: result.acceptanceRate,
      lastSynced: new Date(),
    };

    if (user.baselineLeetcodeTotal === undefined || user.baselineLeetcodeTotal === -1) {
      user.baselineLeetcodeTotal = result.totalSolved;
    }

    await user.save();

    // Trigger full progress recalculation
    const syncRes = await progressService.syncStudent(user._id, { platform: 'leetcode' });
    if (syncRes.user.leetcodeSyncStatus === 'failed') {
      return res.status(502).json({
        success: false,
        message: 'The LeetCode profile was verified, but initial synchronization failed. Please retry.',
      });
    }

    res.status(200).json({
      success: true,
      message: `LeetCode account @${cleanUsername} connected and synchronized successfully!`,
      data: {
        user: syncRes.user,
        leetcodeStats: syncRes.user.leetcodeStats,
        lastSynced: syncRes.user.leetcodeLastSynced,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/integrations/gfg/connect
 * @desc    Connect or update GeeksforGeeks account & perform initial baseline sync
 * @access  Private (Student)
 */
const connectGFG = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ success: false, message: 'GeeksforGeeks username is required' });
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'GeeksforGeeks username contains invalid characters' });
    }
    const user = await User.findById(req.user._id);

    const result = await gfgService.fetchUserProfile(cleanUsername);
    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: 'Unable to verify this GeeksforGeeks profile. Check the username and try again.',
      });
    }

    user.gfgUsername = cleanUsername;
    user.gfgConnected = true;

    user.gfgSyncStatus = 'success';
    user.gfgLastSynced = new Date();
    user.gfgLastError = '';
    user.gfgStats = {
      totalSolved: result.totalSolved,
      schoolSolved: result.schoolSolved,
      basicSolved: result.basicSolved,
      easySolved: result.easySolved,
      mediumSolved: result.mediumSolved,
      hardSolved: result.hardSolved,
      codingScore: result.codingScore,
      institutionRank: result.institutionRank,
      lastSynced: new Date(),
    };
    if (user.baselineGfgTotal === undefined || user.baselineGfgTotal === -1) {
      user.baselineGfgTotal = result.totalSolved;
    }

    await user.save();

    // Trigger full progress recalculation
    const syncRes = await progressService.syncStudent(user._id, { platform: 'gfg' });
    if (syncRes.user.gfgSyncStatus === 'failed') {
      return res.status(502).json({
        success: false,
        message: 'The GeeksforGeeks profile was verified, but initial synchronization failed. Please retry.',
      });
    }

    res.status(200).json({
      success: true,
      message: result.success
        ? `GeeksforGeeks account @${cleanUsername} connected successfully!`
        : `Unable to verify the GeeksforGeeks profile @${cleanUsername}.`,
      data: {
        user: syncRes.user,
        gfgStats: syncRes.user.gfgStats,
        lastSynced: syncRes.user.gfgLastSynced,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/integrations/disconnect
 * @desc    Disconnect platform
 * @access  Private (Student)
 */
const disconnectPlatform = async (req, res, next) => {
  try {
    const { platform } = req.body; // 'leetcode' or 'gfg'
    if (!['leetcode', 'gfg'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'Platform must be leetcode or gfg' });
    }
    const user = await User.findById(req.user._id);

    if (platform === 'leetcode') {
      user.leetcodeConnected = false;
      user.leetcodeUsername = '';
      user.leetcodeSyncStatus = 'idle';
      user.leetcodeLastError = '';
      user.leetcodeStats = { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, ranking: 0, acceptanceRate: 0, lastSynced: null };
      user.baselineLeetcodeTotal = -1;
    } else if (platform === 'gfg') {
      user.gfgConnected = false;
      user.gfgUsername = '';
      user.gfgSyncStatus = 'idle';
      user.gfgLastError = '';
      user.gfgStats = { totalSolved: 0, schoolSolved: 0, basicSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, codingScore: 0, institutionRank: 0, lastSynced: null };
      user.baselineGfgTotal = -1;
    }

    await user.save();
    const syncRes = await progressService.syncStudent(user._id);

    res.status(200).json({
      success: true,
      message: `${platform === 'leetcode' ? 'LeetCode' : 'GeeksforGeeks'} disconnected successfully`,
      data: { user: syncRes.user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/integrations/sync
 * @desc    Manual on-demand sync for all connected platforms
 * @access  Private (Student)
 */
const syncNow = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.leetcodeConnected && !user.gfgConnected) {
      return res.status(400).json({
        success: false,
        message: 'No platforms are currently connected. Please connect LeetCode or GeeksforGeeks first.',
      });
    }

    const syncRes = await progressService.syncStudent(req.user._id);

    if (!syncRes.success && syncRes.errors.length > 0) {
      return res.status(502).json({
        success: false,
        message: 'Unable to update platform data. Please try again later.',
        data: { user: syncRes.user },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progress successfully synchronized across connected platforms',
      data: { user: syncRes.user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/integrations/leetcode/sync
 * @desc    Manual on-demand sync for LeetCode specifically
 * @access  Private (Student)
 */
const syncLeetCode = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.leetcodeConnected) {
      return res.status(400).json({ success: false, message: 'LeetCode is not connected' });
    }

    const syncRes = await progressService.syncStudent(req.user._id, { platform: 'leetcode' });

    if (syncRes.user.leetcodeSyncStatus === 'failed') {
      return res.status(502).json({
        success: false,
        message: syncRes.user.leetcodeLastError || 'Unable to update LeetCode data. Please try again later.',
        data: { user: syncRes.user },
      });
    }

    res.status(200).json({
      success: true,
      message: 'LeetCode data updated successfully',
      data: { user: syncRes.user, stats: syncRes.user.leetcodeStats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/integrations/gfg/sync
 * @desc    Manual on-demand sync for GFG specifically
 * @access  Private (Student)
 */
const syncGFG = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.gfgConnected) {
      return res.status(400).json({ success: false, message: 'GeeksforGeeks is not connected' });
    }

    const syncRes = await progressService.syncStudent(req.user._id, { platform: 'gfg' });

    if (syncRes.user.gfgSyncStatus === 'failed') {
      return res.status(502).json({
        success: false,
        message: syncRes.user.gfgLastError || 'Unable to update GeeksforGeeks data. Please try again later.',
        data: { user: syncRes.user },
      });
    }

    res.status(200).json({
      success: true,
      message: 'GeeksforGeeks data updated successfully',
      data: { user: syncRes.user, stats: syncRes.user.gfgStats },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  connectLeetCode,
  connectGFG,
  disconnectPlatform,
  syncNow,
  syncLeetCode,
  syncGFG,
};
