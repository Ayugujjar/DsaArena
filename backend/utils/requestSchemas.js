const { z } = require('zod');

const email = z.string().trim().min(3).max(254).email();
const name = z.string().trim().min(1).max(100);
const password = z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72);
const id = z.string().regex(/^[a-f0-9]{24}$/i);

const registerBody = z.object({
  name,
  email,
  password,
  confirmPassword: password,
  batch: z.string().max(100).optional(),
  branch: z.string().max(100).optional(),
  college: z.string().max(150).optional(),
  leetcodeUsername: z.string().max(40).optional(),
  gfgUsername: z.string().max(51).optional(),
}).strict();

const adminSetupCodeRequestBody = z.object({ name, email }).strict();
const adminSetupCompleteBody = z.object({
  name,
  email,
  code: z.string().regex(/^\d{6}$/),
  password,
  confirmPassword: password,
}).strict();

const setPasswordBody = z.object({
  password: password,
  confirmPassword: password,
}).strict();

const loginBody = z.object({ email, password }).strict();
const emailBody = z.object({ email }).strict();
const userPasswordBody = z.object({
  currentPassword: password,
  newPassword: password,
}).strict();
const profileBody = z.object({
  name: name.optional(),
  profileImage: z.string().max(2_800_000).optional(),
  branch: z.string().max(100).optional(),
  college: z.string().max(150).optional(),
  batch: z.string().max(100).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one profile field');

const connectPlatformBody = z.object({
  username: z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9_@-]+$/),
}).strict();

const batchCreateBody = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
}).strict();

const batchUpdateBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
}).strict();

const adminCreateBody = z.object({
  name,
  email,
  role: z.enum(['Admin', 'Moderator', 'Super Admin']).optional(),
}).strict();

const notificationBody = z.object({
  recipientType: z.enum(['all', 'batch', 'student', 'students']).optional(),
  recipientId: id.optional(),
  recipientIds: z.array(id).max(100).optional(),
  batchName: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5000),
  type: z.enum(['announcement', 'milestone', 'streak', 'reminder', 'system']).optional(),
}).strict();

const idParams = z.object({ id }).strict();
const tokenParams = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/i) }).strict();

const syncStudentBody = z.object({
  platform: z.enum(['all', 'leetcode', 'gfg']).optional(),
}).strict();

const disconnectBody = z.object({
  platform: z.enum(['leetcode', 'gfg']),
}).strict();

const boundedQueryInteger = (max) =>
  z.string().regex(/^[1-9]\d*$/).refine((value) => Number(value) <= max);
const searchQuery = z.string().max(100);
const pagination = {
  page: boundedQueryInteger(10_000).optional(),
  limit: boundedQueryInteger(100).optional(),
};
const progressQuery = z.object({
  ...pagination,
  platform: z.enum(['All', 'LeetCode', 'GeeksforGeeks']).optional(),
}).strict();
const leaderboardQuery = z.object({
  ...pagination,
  batch: z.string().max(100).optional(),
  timeframe: z.enum(['overall', 'weekly', 'monthly']).optional(),
  search: searchQuery.optional(),
}).strict();
const adminStudentsQuery = z.object({
  ...pagination,
  batch: z.string().max(100).optional(),
  status: z.enum(['active_today', 'active_week', 'inactive', 'failed_sync', 'never_synced']).optional(),
  search: searchQuery.optional(),
  sortBy: z.enum(['name', 'email', 'totalSolved', 'dailySolved', 'weeklySolved', 'monthlySolved', 'currentStreak', 'lastActive', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
}).strict();
const adminSyncMonitorQuery = z.object({
  status: z.enum(['failed', 'success', 'in_progress']).optional(),
  platform: z.enum(['All', 'LeetCode', 'GeeksforGeeks']).optional(),
  search: searchQuery.optional(),
}).strict();
const adminStudentDetailQuery = z.object({
  range: boundedQueryInteger(365).optional(),
}).strict();
const weeklyReportQuery = z.object({
  batch: z.string().max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }).optional(),
  search: searchQuery.optional(),
}).strict();
const monthlyReportQuery = z.object({
  batch: z.string().max(100).optional(),
}).strict();

module.exports = {
  adminStudentDetailQuery,
  adminStudentsQuery,
  adminSyncMonitorQuery,
  adminCreateBody,
  adminSetupCodeRequestBody,
  adminSetupCompleteBody,
  batchCreateBody,
  batchUpdateBody,
  connectPlatformBody,
  disconnectBody,
  emailBody,
  idParams,
  leaderboardQuery,
  loginBody,
  monthlyReportQuery,
  notificationBody,
  profileBody,
  progressQuery,
  registerBody,
  setPasswordBody,
  syncStudentBody,
  tokenParams,
  userPasswordBody,
  weeklyReportQuery,
};
