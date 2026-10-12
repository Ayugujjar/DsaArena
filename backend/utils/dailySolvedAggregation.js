const DailyProgress = require('../models/DailyProgress');
const ProblemActivity = require('../models/ProblemActivity');
const { formatDate } = require('./dateUtils');

const platforms = [
  { activity: 'LeetCode', field: 'leetcode' },
  { activity: 'GeeksforGeeks', field: 'gfg' },
];

const getDailySolvedByStudent = async (userIds, dates) => {
  const dailyTotals = new Map();
  if (!userIds.length || !dates.length) return dailyTotals;

  const dateSet = new Set(dates);
  const dateRangeStart = new Date(`${dates[0]}T00:00:00`);
  const dateRangeEnd = new Date(`${dates[dates.length - 1]}T00:00:00`);
  dateRangeEnd.setDate(dateRangeEnd.getDate() + 1);

  const [progressRecords, activityHistory, activities] = await Promise.all([
    DailyProgress.find({
      userId: { $in: userIds },
      date: { $in: dates },
    }).select('userId date leetcodeSolved gfgSolved').lean(),
    ProblemActivity.aggregate([
      { $match: { userId: { $in: userIds }, platform: { $in: platforms.map(({ activity }) => activity) } } },
      { $group: { _id: { userId: '$userId', platform: '$platform' } } },
    ]),
    ProblemActivity.find({
      userId: { $in: userIds },
      platform: { $in: platforms.map(({ activity }) => activity) },
      solvedAt: { $gte: dateRangeStart, $lt: dateRangeEnd },
    }).select('userId platform solvedAt').lean(),
  ]);

  const progressByDay = new Map();
  progressRecords.forEach((record) => {
    const key = `${record.userId.toString()}_${record.date}`;
    progressByDay.set(key, record);
  });

  const activityByDay = new Map();
  activities.forEach((activity) => {
    const date = formatDate(activity.solvedAt);
    if (!dateSet.has(date)) return;
    const field = platforms.find(({ activity: platform }) => platform === activity.platform)?.field;
    if (!field) return;
    const key = `${activity.userId.toString()}_${date}`;
    const total = activityByDay.get(key) || { leetcode: 0, gfg: 0 };
    total[field] += 1;
    activityByDay.set(key, total);
  });

  const historyByStudent = new Map();
  activityHistory.forEach(({ _id }) => {
    const studentId = _id.userId.toString();
    const history = historyByStudent.get(studentId) || new Set();
    history.add(_id.platform);
    historyByStudent.set(studentId, history);
  });

  userIds.forEach((userId) => {
    const studentId = userId.toString();
    const history = historyByStudent.get(studentId) || new Set();
    dates.forEach((date) => {
      const key = `${studentId}_${date}`;
      const activityCounts = activityByDay.get(key) || { leetcode: 0, gfg: 0 };
      const progress = progressByDay.get(key);
      const leetcode = history.has('LeetCode')
        ? activityCounts.leetcode
        : progress?.leetcodeSolved || 0;
      const gfg = history.has('GeeksforGeeks')
        ? activityCounts.gfg
        : progress?.gfgSolved || 0;
      dailyTotals.set(key, {
        date,
        leetcode,
        gfg,
        solved: leetcode + gfg,
      });
    });
  });

  return dailyTotals;
};

module.exports = { getDailySolvedByStudent };
