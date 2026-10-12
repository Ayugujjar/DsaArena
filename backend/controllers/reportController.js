const User = require('../models/User');
const { getStartOfWeek, formatDate, getPastDates, getStartOfMonth } = require('../utils/dateUtils');
const { escapeRegex } = require('../utils/inputValidation');
const { getDailySolvedByStudent } = require('../utils/dailySolvedAggregation');

/**
 * @route   GET /api/admin/reports/weekly
 * @desc    Weekly Progress Report matrix (Students vs Mon-Sun problem counts)
 * @access  Private (Admin)
 */
const getWeeklyReport = async (req, res, next) => {
  try {
    const { batch, startDate, search } = req.query;
    if ((batch !== undefined && (typeof batch !== 'string' || batch.length > 100)) ||
        (search !== undefined && (typeof search !== 'string' || search.length > 100)) ||
        (startDate !== undefined && (
          typeof startDate !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
          Number.isNaN(new Date(`${startDate}T00:00:00Z`).getTime())
        ))) {
      return res.status(400).json({ success: false, message: 'Invalid report filters' });
    }

    // Determine week dates (Monday through Sunday)
    const weekStart = startDate
      ? getStartOfWeek(new Date(`${startDate}T00:00:00`))
      : getStartOfWeek();
    const weekDays = [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d);
      weekDays.push({
        date: dateStr,
        label: dayLabels[i],
      });
    }

    const query = { status: 'active' };
    if (batch && batch !== 'All') {
      query.batch = batch;
    }
    if (search && search.trim()) {
      query.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const students = await User.find(query)
      .select('name batch leetcodeUsername gfgUsername totalSolved profileImage')
      .lean();

    const studentIds = students.map((s) => s._id);
    const dateStrings = weekDays.map((w) => w.date);

    const dailySolved = await getDailySolvedByStudent(studentIds, dateStrings);

    // Construct matrix
    const matrix = students.map((student) => {
      let weeklyTotal = 0;
      const days = weekDays.map((w) => {
        const key = `${student._id.toString()}_${w.date}`;
        const record = dailySolved.get(key);
        const count = record?.solved || 0;
        weeklyTotal += count;
        return {
          date: w.date,
          day: w.label,
          solved: count,
          leetcode: record?.leetcode || 0,
          gfg: record?.gfg || 0,
        };
      });

      return {
        studentId: student._id,
        name: student.name,
        batch: student.batch,
        profileImage: student.profileImage,
        days,
        weeklyTotal,
        overallTotal: student.totalSolved,
      };
    });

    // Sort by weekly total descending
    matrix.sort((a, b) => b.weeklyTotal - a.weeklyTotal);

    res.status(200).json({
      success: true,
      weekDays,
      matrix,
      weekStart: weekDays[0].date,
      weekEnd: weekDays[6].date,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/reports/monthly
 * @desc    Monthly analytics with top/least active students and batch comparison
 * @access  Private (Admin)
 */
const getMonthlyReport = async (req, res, next) => {
  try {
    const { batch } = req.query;
    const query = { status: 'active' };
    if (batch && batch !== 'All') {
      query.batch = batch;
    }

    const students = await User.find(query)
      .select('name batch branch totalSolved currentStreak profileImage')
      .lean();
    const studentIds = students.map((student) => student._id);
    const past30Dates = getPastDates(30);
    const firstOfMonth = formatDate(getStartOfMonth());
    const monthDays = [];
    const monthCursor = getStartOfMonth();
    const today = new Date();
    while (formatDate(monthCursor) <= formatDate(today)) {
      monthDays.push(formatDate(monthCursor));
      monthCursor.setDate(monthCursor.getDate() + 1);
    }
    const reportDates = Array.from(new Set([...past30Dates, ...monthDays])).sort();
    const dailySolved = await getDailySolvedByStudent(studentIds, reportDates);

    const dailyMap = {};
    const monthlyStudentTotals = new Map(studentIds.map((id) => [id.toString(), {
      monthlySolved: 0,
      leetcodeSolved: 0,
      gfgSolved: 0,
    }]));
    dailySolved.forEach((record, key) => {
      const studentId = key.slice(0, key.lastIndexOf('_'));
      const total = record.solved;
      if (!dailyMap[record.date]) dailyMap[record.date] = { solved: 0, leetcodeSolved: 0, gfgSolved: 0 };
      dailyMap[record.date].solved += total;
      dailyMap[record.date].leetcodeSolved += record.leetcode;
      dailyMap[record.date].gfgSolved += record.gfg;

      if (record.date >= firstOfMonth) {
        const studentTotals = monthlyStudentTotals.get(studentId);
        if (studentTotals) {
          studentTotals.monthlySolved += total;
          studentTotals.leetcodeSolved += record.leetcode;
          studentTotals.gfgSolved += record.gfg;
        }
      }
    });

    const studentsWithMonthlyTotals = students.map((student) => ({
      ...student,
      ...(monthlyStudentTotals.get(student._id.toString()) || { monthlySolved: 0, leetcodeSolved: 0, gfgSolved: 0 }),
    }));
    const totalStudents = studentsWithMonthlyTotals.length;
    const summary = studentsWithMonthlyTotals.reduce((totals, student) => ({
      totalProblemsSolved: totals.totalProblemsSolved + student.monthlySolved,
      leetcodeSolved: totals.leetcodeSolved + student.leetcodeSolved,
      gfgSolved: totals.gfgSolved + student.gfgSolved,
    }), { totalProblemsSolved: 0, leetcodeSolved: 0, gfgSolved: 0 });
    const avgProblemsPerStudent = totalStudents > 0
      ? Math.round(summary.totalProblemsSolved / totalStudents)
      : 0;

    const sortedStudents = [...studentsWithMonthlyTotals]
      .sort((a, b) => b.monthlySolved - a.monthlySolved);
    const mostActive = sortedStudents.slice(0, 5);
    const leastActive = sortedStudents.filter((student) => student.monthlySolved === 0).slice(0, 5);

    const batchTotals = new Map();
    studentsWithMonthlyTotals.forEach((student) => {
      const totals = batchTotals.get(student.batch) || { studentCount: 0, monthlySolved: 0 };
      totals.studentCount += 1;
      totals.monthlySolved += student.monthlySolved;
      batchTotals.set(student.batch, totals);
    });
    const batchComparison = Array.from(batchTotals, ([batchName, totals]) => ({
      batch: batchName,
      studentCount: totals.studentCount,
      monthlySolved: totals.monthlySolved,
      avgPerStudent: Math.round(totals.monthlySolved / totals.studentCount),
    }));

    const monthlyTrend = past30Dates.map((dateStr) => ({
      date: dateStr,
      ...(dailyMap[dateStr] || { solved: 0, leetcodeSolved: 0, gfgSolved: 0 }),
    }));

    res.status(200).json({
      success: true,
      summary: {
        totalStudents,
        totalProblemsSolved: summary.totalProblemsSolved,
        avgProblemsPerStudent,
        leetcodeSolved: summary.leetcodeSolved,
        gfgSolved: summary.gfgSolved,
      },
      mostActive,
      leastActive,
      batchComparison,
      monthlyTrend,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeeklyReport,
  getMonthlyReport,
};
