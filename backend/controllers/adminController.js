const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { sendAdminSetupInvitation } = require('../utils/adminInvitation');
const Batch = require('../models/Batch');
const DailyProgress = require('../models/DailyProgress');
const ProblemActivity = require('../models/ProblemActivity');
const progressService = require('../services/progressService');
const leetcodeService = require('../services/leetcodeService');
const gfgService = require('../services/gfgService');
const { getPastDates, formatDate } = require('../utils/dateUtils');
const { isProgressCronActive } = require('../jobs/updateStudentProgress');
const { escapeRegex, parseBoundedInteger } = require('../utils/inputValidation');
const { getDailySolvedByStudent } = require('../utils/dailySolvedAggregation');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get real organization statistics from MongoDB
 * @access  Private (Admin)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments();
    const allStudents = await User.find().select(
      'name email batch totalSolved weeklySolved dailySolved currentStreak lastActive leetcodeConnected gfgConnected leetcodeSyncStatus gfgSyncStatus leetcodeStats.totalSolved gfgStats.totalSolved'
    );

    const now = new Date();
    let activeToday = 0;
    let activeThisWeek = 0;
    let inactive = 0;
    let totalProblems = 0;
    let leetcodeProblems = 0;
    let gfgProblems = 0;
    let connectedLeetcode = 0;
    let connectedGfg = 0;
    let failedSyncs = 0;

    const inactiveStudents = [];

    allStudents.forEach((s) => {
      totalProblems += s.totalSolved || 0;
      leetcodeProblems += s.leetcodeStats?.totalSolved || 0;
      gfgProblems += s.gfgStats?.totalSolved || 0;

      if (s.leetcodeConnected) connectedLeetcode++;
      if (s.gfgConnected) connectedGfg++;

      if (s.leetcodeSyncStatus === 'failed' || s.gfgSyncStatus === 'failed') {
        failedSyncs++;
      }

      if (!s.lastActive) {
        inactive++;
        inactiveStudents.push(s);
      } else {
        const diffHours = (now - new Date(s.lastActive)) / (1000 * 60 * 60);
        if (diffHours <= 24) {
          activeToday++;
          activeThisWeek++;
        } else if (diffHours <= 168) {
          activeThisWeek++;
        } else {
          inactive++;
          inactiveStudents.push(s);
        }
      }
    });

    // Top 5 performers
    const topPerformers = await User.find({ totalSolved: { $gt: 0 } })
      .select('name batch totalSolved currentStreak profileImage')
      .sort({ totalSolved: -1 })
      .limit(5);

    // Batch breakdowns (from real database)
    const batches = await Batch.find();
    const batchStats = await Promise.all(
      batches.map(async (b) => {
        const count = await User.countDocuments({ batch: b.name });
        const batchStudents = await User.find({ batch: b.name }).select('totalSolved lastActive');
        const solved = batchStudents.reduce((sum, s) => sum + (s.totalSolved || 0), 0);
        const batchActiveToday = batchStudents.filter((s) => {
          if (!s.lastActive) return false;
          return (now - new Date(s.lastActive)) / (1000 * 60 * 60) <= 24;
        }).length;

        return {
          id: b._id,
          name: b.name,
          studentCount: count,
          totalProblems: solved,
          avgProblems: count > 0 ? Math.round(solved / count) : 0,
          activeToday: batchActiveToday,
        };
      })
    );

    // Recent 7 days global activity trend from DailyProgress
    const past7Dates = getPastDates(7);
    const trendProgress = await getDailySolvedByStudent(
      allStudents.map((student) => student._id),
      past7Dates
    );

    const weeklyTrend = past7Dates.map((dateStr) => ({
      date: dateStr,
      solved: allStudents.reduce(
        (sum, student) => sum + (trendProgress.get(`${student._id.toString()}_${dateStr}`)?.solved || 0),
        0
      ),
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        activeToday,
        activeThisWeek,
        inactive,
        totalProblems,
        leetcodeProblems,
        gfgProblems,
        connectedLeetcode,
        connectedGfg,
        failedSyncs,
      },
      topPerformers,
      batchStats,
      weeklyTrend,
      inactiveAlerts: inactiveStudents.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/students
 * @desc    Get searchable, filterable, paginated student list from real database
 * @access  Private (Admin)
 */
const getStudents = async (req, res, next) => {
  try {
    const { batch, status, search, sortBy = 'totalSolved', order = 'desc' } = req.query;
    const pageNum = parseBoundedInteger(req.query.page, { fallback: 1, max: 10000 });
    const limitNum = parseBoundedInteger(req.query.limit, { fallback: 20, max: 100 });
    const allowedSortFields = new Set([
      'name', 'email', 'totalSolved', 'dailySolved', 'weeklySolved', 'monthlySolved', 'currentStreak', 'lastActive', 'createdAt',
    ]);
    if (pageNum === null || limitNum === null || !allowedSortFields.has(sortBy) ||
        !['asc', 'desc'].includes(order) ||
        (status && !['active_today', 'active_week', 'inactive', 'failed_sync', 'never_synced'].includes(status)) ||
        (search !== undefined && (typeof search !== 'string' || search.length > 100)) ||
        (batch !== undefined && (typeof batch !== 'string' || batch.length > 100))) {
      return res.status(400).json({ success: false, message: 'Invalid student filter or pagination parameters' });
    }

    const query = {};

    if (batch && batch !== 'All') {
      query.batch = batch;
    }

    if (search && search.trim()) {
      const regex = { $regex: escapeRegex(search.trim()), $options: 'i' };
      query.$or = [
        { name: regex },
        { email: regex },
        { leetcodeUsername: regex },
        { gfgUsername: regex },
        { college: regex },
      ];
    }

    // Status filter
    const now = new Date();
    if (status === 'active_today') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      query.lastActive = { $gte: yesterday };
    } else if (status === 'active_week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query.lastActive = { $gte: sevenDaysAgo };
    } else if (status === 'inactive') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query.$or = [{ lastActive: { $lt: sevenDaysAgo } }, { lastActive: null }];
    } else if (status === 'failed_sync') {
      query.$or = [{ leetcodeSyncStatus: 'failed' }, { gfgSyncStatus: 'failed' }];
    } else if (status === 'never_synced') {
      query.leetcodeLastSynced = null;
      query.gfgLastSynced = null;
    }

    const sortOption = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      User.find(query).select('-password').sort(sortOption).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query),
    ]);

    const enriched = students.map((s) => {
      let activityStatus = 'inactive';
      if (!s.lastActive) {
        activityStatus = 'never_active';
      } else {
        const diffHours = (now - new Date(s.lastActive)) / (1000 * 60 * 60);
        if (diffHours <= 24) activityStatus = 'active_today';
        else if (diffHours <= 168) activityStatus = 'active_week';
      }
      return {
        ...s,
        activityStatus,
      };
    });

    res.status(200).json({
      success: true,
      students: enriched,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/sync-monitor
 * @desc    Dedicated monitor of student synchronization statuses and errors
 * @access  Private (Admin)
 */
const getSyncMonitor = async (req, res, next) => {
  try {
    const { status, platform, search } = req.query;
    if ((status && !['failed', 'success', 'in_progress'].includes(status)) ||
        (platform && !['All', 'LeetCode', 'GeeksforGeeks'].includes(platform)) ||
        (search !== undefined && (typeof search !== 'string' || search.length > 100))) {
      return res.status(400).json({ success: false, message: 'Invalid sync-monitor filters' });
    }
    const query = {
      $or: [{ leetcodeConnected: true }, { gfgConnected: true }],
    };

    if (search && search.trim()) {
      query.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    if (status === 'failed') {
      query.$or = [{ leetcodeSyncStatus: 'failed' }, { gfgSyncStatus: 'failed' }];
    } else if (status === 'success') {
      query.$or = [{ leetcodeSyncStatus: 'success' }, { gfgSyncStatus: 'success' }];
    } else if (status === 'in_progress') {
      query.$or = [{ leetcodeSyncStatus: 'in_progress' }, { gfgSyncStatus: 'in_progress' }];
    }

    const students = await User.find(query)
      .select('name email batch leetcodeUsername gfgUsername leetcodeConnected gfgConnected leetcodeSyncStatus gfgSyncStatus leetcodeLastSynced gfgLastSynced leetcodeLastError gfgLastError leetcodeSyncAttempts gfgSyncAttempts')
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();

    const monitorRecords = [];

    students.forEach((s) => {
      if (s.leetcodeConnected && (!platform || platform === 'All' || platform === 'LeetCode')) {
        monitorRecords.push({
          studentId: s._id,
          name: s.name,
          email: s.email,
          batch: s.batch,
          platform: 'LeetCode',
          handle: s.leetcodeUsername,
          lastSynced: s.leetcodeLastSynced,
          status: s.leetcodeSyncStatus || 'idle',
          lastError: s.leetcodeLastError || '',
          syncAttempts: s.leetcodeSyncAttempts || 0,
        });
      }

      if (s.gfgConnected && (!platform || platform === 'All' || platform === 'GeeksforGeeks')) {
        monitorRecords.push({
          studentId: s._id,
          name: s.name,
          email: s.email,
          batch: s.batch,
          platform: 'GeeksforGeeks',
          handle: s.gfgUsername,
          lastSynced: s.gfgLastSynced,
          status: s.gfgSyncStatus || 'idle',
          lastError: s.gfgLastError || '',
          syncAttempts: s.gfgSyncAttempts || 0,
        });
      }
    });

    res.status(200).json({
      success: true,
      records: monitorRecords,
      total: monitorRecords.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/system/health
 * @desc    Comprehensive system health and integration diagnostic
 * @access  Private (Admin)
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStateNames = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    const [leetcodeHealth, gfgHealth] = await Promise.all([
      leetcodeService.checkAvailability(),
      gfgService.checkAvailability(),
    ]);

    // Counts
    const [studentCount, batchCount, dailyCount, failedCount] = await Promise.all([
      User.countDocuments(),
      Batch.countDocuments(),
      DailyProgress.countDocuments(),
      User.countDocuments({
        $or: [{ leetcodeSyncStatus: 'failed' }, { gfgSyncStatus: 'failed' }],
      }),
    ]);
    const [activityCount, latestLeetCodeSync, latestGfgSync] = await Promise.all([
      ProblemActivity.countDocuments(),
      User.findOne({ leetcodeLastSynced: { $ne: null } })
        .sort({ leetcodeLastSynced: -1 })
        .select('leetcodeLastSynced')
        .lean(),
      User.findOne({ gfgLastSynced: { $ne: null } })
        .sort({ gfgLastSynced: -1 })
        .select('gfgLastSynced')
        .lean(),
    ]);
    const lastSuccessfulSync = [
      latestLeetCodeSync?.leetcodeLastSynced,
      latestGfgSync?.gfgLastSynced,
    ]
      .filter(Boolean)
      .sort((left, right) => right - left)[0] || null;

    res.status(200).json({
      success: true,
      data: {
        database: {
          status: dbStateNames[dbState] || 'Unknown',
          host: mongoose.connection.host,
          databaseName: mongoose.connection.name,
          totalStudents: studentCount,
          totalBatches: batchCount,
          totalProgressRecords: dailyCount,
          totalActivityRecords: activityCount,
        },
        backend: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          serverTimestamp: new Date().toISOString(),
        },
        integrations: {
          leetcode: { ...leetcodeHealth, endpoint: 'https://leetcode.com/graphql' },
          geeksforgeeks: { ...gfgHealth, endpoint: 'https://www.geeksforgeeks.org/' },
        },
        scheduler: {
          cronSchedule: process.env.CRON_SCHEDULE || '0 */6 * * *',
          status: isProgressCronActive() ? 'Active' : 'Inactive',
        },
        telemetry: {
          failedSyncCount: failedCount,
          lastSuccessfulSync,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/students/:id
 * @desc    Detailed analytics for an individual student from real database
 * @access  Private (Admin)
 */
const getStudentDetail = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid student identifier' });
    }
    const days = parseBoundedInteger(req.query.range, { fallback: 30, max: 365 });
    if (days === null) {
      return res.status(400).json({ success: false, message: 'Range must be between 1 and 365 days' });
    }
    const student = await User.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const pastDates = getPastDates(days);

    const progressMap = await getDailySolvedByStudent([student._id], pastDates);

    const historyTimeline = pastDates.map((dateStr) => {
      const doc = progressMap.get(`${student._id.toString()}_${dateStr}`);
      return {
        date: dateStr,
        totalSolved: doc?.solved || 0,
        leetcodeSolved: doc?.leetcode || 0,
        gfgSolved: doc?.gfg || 0,
      };
    });

    const recentProblems = await ProblemActivity.find({ userId: student._id })
      .sort({ solvedAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      student,
      historyTimeline,
      recentProblems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/students/:id/sync
 * @desc    Trigger sync on behalf of student
 * @access  Private (Admin)
 */
const syncStudentOnDemand = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid student identifier' });
    }
    const platform = req.body?.platform || 'all';
    if (!['all', 'leetcode', 'gfg'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    const syncRes = await progressService.syncStudent(req.params.id, { platform });
    if (!syncRes.success) {
      return res.status(502).json({
        success: false,
        message: 'Unable to synchronize this student. Review the platform status and try again.',
        student: syncRes.user,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progress synced successfully for student',
      student: syncRes.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/sync-all
 * @desc    Trigger batch sync for all students
 * @access  Private (Admin)
 */
const syncAllStudents = async (req, res, next) => {
  try {
    progressService.syncAllStudents().then((results) => {
      console.log(`[Admin] Background batch sync finished. Updated ${results.length} students.`);
    });

    res.status(200).json({
      success: true,
      message: 'Background synchronization worker started for all active students',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/admins
 * @desc    Get all admins
 * @access  Private (Admin)
 */
const getAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, admins });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/admins
 * @desc    Create new admin (Super Admin only)
 * @access  Private (Super Admin)
 */
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, role = 'Admin' } = req.body;

    if (typeof name !== 'string' || typeof email !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'A name and valid email are required' });
    }
    if (name.trim().length > 100 || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid name and email address' });
    }
    if (!['Admin', 'Moderator', 'Super Admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Please select a valid administrator role' });
    }
    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An admin with this email already exists' });
    }

    let defaultPermissions = ['view_students', 'view_reports', 'manage_batches'];
    if (role === 'Super Admin') {
      defaultPermissions = ['manage_admins', 'view_students', 'view_reports', 'manage_batches', 'delete_records', 'system_health'];
    } else if (role === 'Moderator') {
      defaultPermissions = ['view_students', 'view_reports'];
    }

    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: crypto.randomBytes(32).toString('hex'),
      role,
      permissions: defaultPermissions,
      createdBy: req.admin._id,
    });
    let invitation;
    try {
      invitation = await sendAdminSetupInvitation(admin);
    } catch {
      await Admin.deleteOne({ _id: admin._id });
      return res.status(502).json({
        success: false,
        message: 'The setup invitation could not be sent. No administrator account was created; please try again.',
      });
    }

    res.status(201).json({
      success: true,
      emailSent: invitation.emailSent,
      ...(invitation.emailSent ? {} : { setupUrl: invitation.setupUrl }),
      message: invitation.emailSent
        ? 'Admin account created. A one-time password setup link has been emailed; it expires in 30 minutes.'
        : 'Email is not configured. Share the one-time setup link securely; it expires in 30 minutes.',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/admins/:id
 * @desc    Delete admin (Super Admin only)
 * @access  Private (Super Admin)
 */
const deleteAdmin = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid administrator identifier' });
    }
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getStudents,
  getSyncMonitor,
  getSystemHealth,
  getStudentDetail,
  syncStudentOnDemand,
  syncAllStudents,
  getAdmins,
  createAdmin,
  deleteAdmin,
};
