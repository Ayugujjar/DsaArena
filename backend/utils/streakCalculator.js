const { getTodayString, getYesterdayString, formatDate } = require('./dateUtils');

/**
 * Calculates current and longest streaks from an array or Set of active date strings ('YYYY-MM-DD').
 * @param {string[]|Set<string>} activeDates
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
const calculateStreaks = (activeDates) => {
  const dateSet = new Set(activeDates);
  if (dateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = getTodayString();
  const yesterday = getYesterdayString();

  // Current streak calculation
  let currentStreak = 0;
  let checkDate = new Date();

  // If not active today, check if active yesterday (alive streak)
  if (!dateSet.has(today)) {
    if (dateSet.has(yesterday)) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Streak broken
      checkDate = null;
    }
  }

  if (checkDate) {
    while (true) {
      const dateStr = formatDate(checkDate);
      if (dateSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Longest streak calculation across all unique sorted dates
  const sortedDates = Array.from(dateSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const curDate = new Date(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = curDate;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
};

module.exports = {
  calculateStreaks,
};
