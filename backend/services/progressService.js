const User = require('../models/User');
const DailyProgress = require('../models/DailyProgress');
const ProblemActivity = require('../models/ProblemActivity');
const Notification = require('../models/Notification');
const leetcodeService = require('./leetcodeService');
const gfgService = require('./gfgService');
const { getTodayString, getStartOfWeek, getStartOfMonth, formatDate } = require('../utils/dateUtils');
const { calculateStreaks } = require('../utils/streakCalculator');

class ProgressService {
  /**
   * Syncs DSA progress for an individual student across all connected platforms.
   * @param {string} userId
   * @param {Object} options - { forceRefresh: boolean, platform: 'all'|'leetcode'|'gfg' }
   * @returns {Promise<Object>}
   */
  async syncStudent(userId, options = {}) {
    const startedAt = Date.now();
    const { platform = 'all' } = options;
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Student not found');
    }

    const todayStr = getTodayString();
    let lcResult = null;
    let gfgResult = null;
    const syncErrors = [];

    // Mark sync in progress
    if (platform === 'all' || platform === 'leetcode') {
      if (user.leetcodeConnected) {
        user.leetcodeSyncStatus = 'in_progress';
        user.leetcodeSyncAttempts = (user.leetcodeSyncAttempts || 0) + 1;
      }
    }
    if (platform === 'all' || platform === 'gfg') {
      if (user.gfgConnected) {
        user.gfgSyncStatus = 'in_progress';
        user.gfgSyncAttempts = (user.gfgSyncAttempts || 0) + 1;
      }
    }
    user.syncAttempts = (user.syncAttempts || 0) + 1;
    await user.save();

    // 1. Sync LeetCode
    if ((platform === 'all' || platform === 'leetcode') && user.leetcodeUsername && user.leetcodeConnected) {
      try {
        console.info(JSON.stringify({
          event: 'platform_sync_started',
          userId: user._id.toString(),
          platform: 'leetcode',
          timestamp: new Date().toISOString(),
        }));
        lcResult = await leetcodeService.fetchUserProfile(user.leetcodeUsername);

        if (lcResult.success) {
          user.leetcodeStats = {
            totalSolved: lcResult.totalSolved,
            easySolved: lcResult.easySolved,
            mediumSolved: lcResult.mediumSolved,
            hardSolved: lcResult.hardSolved,
            ranking: lcResult.ranking,
            acceptanceRate: lcResult.acceptanceRate,
            lastSynced: new Date(),
          };
          user.leetcodeSyncStatus = 'success';
          user.leetcodeLastSynced = new Date();
          user.leetcodeLastError = '';

          // Baseline handling: if first time connecting, establish baseline
          if (user.baselineLeetcodeTotal === undefined || user.baselineLeetcodeTotal === -1) {
            user.baselineLeetcodeTotal = lcResult.totalSolved;
          }

          await this._saveRecentSubmissions(user._id, 'LeetCode', lcResult.recentSubmissions);

          console.info(JSON.stringify({
            event: 'platform_sync_completed',
            userId: user._id.toString(),
            platform: 'leetcode',
            timestamp: new Date().toISOString(),
          }));
        } else {
          user.leetcodeSyncStatus = 'failed';
          user.leetcodeLastError = lcResult.error || 'Unable to fetch LeetCode data';
          if (user.baselineLeetcodeTotal === -1) user.leetcodeConnected = false;
          syncErrors.push(`LeetCode: ${user.leetcodeLastError}`);
          console.error(JSON.stringify({
            event: 'platform_sync_failed',
            userId: user._id.toString(),
            platform: 'leetcode',
            category: 'external_api',
            timestamp: new Date().toISOString(),
          }));
        }
      } catch (err) {
        user.leetcodeSyncStatus = 'failed';
        user.leetcodeLastError = err.message || 'LeetCode synchronization error';
        if (user.baselineLeetcodeTotal === -1) user.leetcodeConnected = false;
        syncErrors.push(`LeetCode: ${user.leetcodeLastError}`);
        console.error(JSON.stringify({
          event: 'platform_sync_failed',
          userId: user._id.toString(),
          platform: 'leetcode',
          category: 'request_error',
          timestamp: new Date().toISOString(),
        }));
      }
    } else if (!user.leetcodeConnected) {
      user.leetcodeSyncStatus = 'idle';
    }

    // 2. Sync GeeksforGeeks
    if ((platform === 'all' || platform === 'gfg') && user.gfgUsername && user.gfgConnected) {
      try {
        console.info(JSON.stringify({
          event: 'platform_sync_started',
          userId: user._id.toString(),
          platform: 'gfg',
          timestamp: new Date().toISOString(),
        }));
        gfgResult = await gfgService.fetchUserProfile(user.gfgUsername);

        if (gfgResult.success) {
          user.gfgStats = {
            totalSolved: gfgResult.totalSolved,
            schoolSolved: gfgResult.schoolSolved,
            basicSolved: gfgResult.basicSolved,
            easySolved: gfgResult.easySolved,
            mediumSolved: gfgResult.mediumSolved,
            hardSolved: gfgResult.hardSolved,
            codingScore: gfgResult.codingScore,
            institutionRank: gfgResult.institutionRank,
            lastSynced: new Date(),
          };
          user.gfgSyncStatus = 'success';
          user.gfgLastSynced = new Date();
          user.gfgLastError = '';

          // Baseline handling
          if (user.baselineGfgTotal === undefined || user.baselineGfgTotal === -1) {
            user.baselineGfgTotal = gfgResult.totalSolved;
          }
          await this._saveRecentSubmissions(user._id, 'GeeksforGeeks', gfgResult.recentSubmissions);
          console.info(JSON.stringify({
            event: 'platform_sync_completed',
            userId: user._id.toString(),
            platform: 'gfg',
            timestamp: new Date().toISOString(),
          }));
        } else {
          user.gfgSyncStatus = 'failed';
          user.gfgLastError = gfgResult.error || 'Unable to fetch GeeksforGeeks data';
          if (user.baselineGfgTotal === -1) user.gfgConnected = false;
          syncErrors.push(`GFG: ${user.gfgLastError}`);
          console.error(JSON.stringify({
            event: 'platform_sync_failed',
            userId: user._id.toString(),
            platform: 'gfg',
            category: 'external_api',
            timestamp: new Date().toISOString(),
          }));
        }
      } catch (err) {
        user.gfgSyncStatus = 'failed';
        user.gfgLastError = err.message || 'GeeksforGeeks synchronization error';
        if (user.baselineGfgTotal === -1) user.gfgConnected = false;
        syncErrors.push(`GFG: ${user.gfgLastError}`);
        console.error(JSON.stringify({
          event: 'platform_sync_failed',
          userId: user._id.toString(),
          platform: 'gfg',
          category: 'request_error',
          timestamp: new Date().toISOString(),
        }));
      }
    } else if (!user.gfgConnected) {
      user.gfgSyncStatus = 'idle';
    }

    // 3. Compute Aggregated Totals
    const totalLc = user.leetcodeStats?.totalSolved || 0;
    const totalGfg = user.gfgStats?.totalSolved || 0;
    const newTotalSolved = totalLc + totalGfg;

    const easySolved = (user.leetcodeStats?.easySolved || 0) + (user.gfgStats?.easySolved || 0);

    const mediumSolved =
      (user.leetcodeStats?.mediumSolved || 0) +
      (user.gfgStats?.mediumSolved || 0);

    const hardSolved =
      (user.leetcodeStats?.hardSolved || 0) +
      (user.gfgStats?.hardSolved || 0);

    // 4. Calculate today's solved count from daily progress record
    let todayRecord = await DailyProgress.findOne({ userId: user._id, date: todayStr });

    // Daily totals are derived only from earlier snapshots taken on the same day.
    // A day-to-day total delta cannot establish when the problems were solved.
    const previousSnapshot = todayRecord;
    const priorLeetCodeTotal = previousSnapshot?.leetcodeTotal;
    const priorGfgTotal = previousSnapshot?.gfgTotal;
    const leetcodeSnapshotInconsistent =
      Boolean(todayRecord?.leetcodeSnapshotInconsistent) ||
      (priorLeetCodeTotal !== undefined && totalLc < priorLeetCodeTotal);
    const gfgSnapshotInconsistent =
      Boolean(todayRecord?.gfgSnapshotInconsistent) ||
      (priorGfgTotal !== undefined && totalGfg < priorGfgTotal);
    const todayLcSolved =
      (todayRecord?.leetcodeSolved || 0) +
      (priorLeetCodeTotal === undefined || leetcodeSnapshotInconsistent
        ? 0
        : Math.max(0, totalLc - priorLeetCodeTotal));
    const todayGfgSolved =
      (todayRecord?.gfgSolved || 0) +
      (priorGfgTotal === undefined || gfgSnapshotInconsistent
        ? 0
        : Math.max(0, totalGfg - priorGfgTotal));
    const todayTotal = todayLcSolved + todayGfgSolved;

    await DailyProgress.findOneAndUpdate(
      { userId: user._id, date: todayStr },
      {
        $set: {
          userId: user._id,
          date: todayStr,
          leetcodeSolved: todayLcSolved,
          gfgSolved: todayGfgSolved,
          totalSolved: todayTotal,
          cumulativeTotal: newTotalSolved,
          leetcodeTotal: totalLc,
          leetcodeSnapshotInconsistent,
          gfgTotal: totalGfg,
          gfgSnapshotInconsistent,
        },
      },
      { upsert: true, new: true }
    );

    // 5. Compute Weekly and Monthly totals strictly from DailyProgress records
    const monday = getStartOfWeek();
    const mondayStr = formatDate(monday);
    const firstDayMonth = getStartOfMonth();
    const firstDayMonthStr = formatDate(firstDayMonth);

    const weeklyRecords = await DailyProgress.find({
      userId: user._id,
      date: { $gte: mondayStr },
    });
    const weeklySolved = weeklyRecords.reduce((sum, r) => sum + (r.totalSolved || 0), 0);

    const monthlyRecords = await DailyProgress.find({
      userId: user._id,
      date: { $gte: firstDayMonthStr },
    });
    const monthlySolved = monthlyRecords.reduce((sum, r) => sum + (r.totalSolved || 0), 0);

    // 6. Calculate Streak
    const allActiveDays = await DailyProgress.find({
      userId: user._id,
      totalSolved: { $gt: 0 },
    }).select('date');

    const activeDateStrings = allActiveDays.map((d) => d.date);
    const { currentStreak, longestStreak } = calculateStreaks(activeDateStrings);

    // 7. Update User fields
    user.totalSolved = newTotalSolved;
    user.dailySolved = todayTotal;
    user.weeklySolved = weeklySolved;
    user.monthlySolved = monthlySolved;
    user.easySolved = easySolved;
    user.mediumSolved = mediumSolved;
    user.hardSolved = hardSolved;
    user.currentStreak = currentStreak;
    user.longestStreak = Math.max(user.longestStreak || 0, longestStreak);
    if (todayTotal > 0) {
      user.lastActive = new Date();
    }

    await user.save();

    // 8. Check for genuine milestones
    await this._checkMilestones(user);

    console.info(JSON.stringify({
      event: syncErrors.length === 0 ? 'student_sync_completed' : 'student_sync_completed_with_errors',
      userId: user._id.toString(),
      platform,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      errorCount: syncErrors.length,
    }));

    return {
      success: syncErrors.length === 0,
      user,
      errors: syncErrors,
      leetcode: lcResult,
      gfg: gfgResult,
    };
  }

  /**
   * Batch sync for all registered students (used by cron job and admin bulk sync).
   */
  async syncAllStudents() {
    const students = await User.find({ status: 'active' });
    console.log(`[ProgressService] Starting background sync for ${students.length} students...`);
    const results = [];

    for (const student of students) {
      if (!student.leetcodeConnected && !student.gfgConnected) continue;

      try {
        const res = await this.syncStudent(student._id);
        results.push({ id: student._id, name: student.name, success: res.success });
        // Polite delay to prevent rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[ProgressService] Failed sync for ${student.email}:`, err.message);
        results.push({ id: student._id, name: student.name, success: false, error: err.message });
      }
    }

    return results;
  }

  /**
   * Persist timestamped accepted problems once so activity charts use solve dates.
   */
  async _saveRecentSubmissions(userId, platform, submissions) {
    if (!Array.isArray(submissions)) return;

    for (const submission of submissions) {
      if (!submission || !submission.problemName) continue;
      const solvedAt = new Date(submission.solvedAt);
      if (Number.isNaN(solvedAt.getTime())) continue;

      try {
        await ProblemActivity.updateOne(
          { userId, platform, problemName: submission.problemName },
          {
            $setOnInsert: {
              userId,
              platform,
              problemName: submission.problemName,
              problemSlug: submission.problemSlug || '',
              problemUrl: submission.problemUrl || '',
              difficulty: submission.difficulty || 'Unknown',
              solvedAt,
            },
          },
          { upsert: true }
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }
  }

  /**
   * Internal milestone checker
   */
  async _checkMilestones(user) {
    const milestones = [25, 50, 100, 250, 500, 1000];
    for (const m of milestones) {
      if (user.totalSolved >= m) {
        const existing = await Notification.findOne({
          recipientId: user._id,
          type: 'milestone',
          title: `Milestone Unlocked: ${m} Problems Solved!`,
        });
        if (!existing) {
          await Notification.create({
            recipientType: 'student',
            recipientId: user._id,
            title: `Milestone Unlocked: ${m} Problems Solved!`,
            message: `Congratulations ${user.name}! You have solved ${m}+ problems! Keep up the momentum! 🎉`,
            type: 'milestone',
          });
        }
      }
    }
  }
}

module.exports = new ProgressService();
