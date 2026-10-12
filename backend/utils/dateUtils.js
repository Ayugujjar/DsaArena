/**
 * Date utility functions for DSA Progress Tracker
 */

const formatDate = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayString = () => formatDate(new Date());

const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
};

const getStartOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getStartOfMonth = (d = new Date()) => {
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

const getPastDates = (days = 7) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
};

module.exports = {
  formatDate,
  getTodayString,
  getYesterdayString,
  getStartOfWeek,
  getStartOfMonth,
  getPastDates,
};
