import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Auth APIs (Student)
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Admin Auth APIs
export const adminAuthAPI = {
  checkSetupStatus: () => api.get('/admin/auth/setup-status'),
  requestSetupCode: (data) => api.post('/admin/auth/setup', data),
  completeInitialSetup: (data) => api.post('/admin/auth/setup/verify', data),
  setupPassword: (token, data) => api.post(`/admin/auth/setup-password/${token}`, data),
  login: (data) => api.post('/admin/auth/login', data),
  getMe: () => api.get('/admin/auth/me'),
  logout: () => api.post('/admin/auth/logout'),
};

// User Profile APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePassword: (data) => api.put('/users/password', data),
  getPublicProfile: (id) => api.get(`/users/${id}/public`),
};

// Platform Integration APIs
export const integrationAPI = {
  connectLeetCode: (username) => api.post('/integrations/leetcode/connect', { username }),
  connectGFG: (username) => api.post('/integrations/gfg/connect', { username }),
  disconnect: (platform) => api.post('/integrations/disconnect', { platform }),
  syncNow: () => api.post('/integrations/sync'),
  syncLeetCode: () => api.post('/integrations/leetcode/sync'),
  syncGFG: () => api.post('/integrations/gfg/sync'),
};

// Progress Tracking APIs
export const progressAPI = {
  getMyProgress: () => api.get('/progress/me'),
  getActivityHistory: (params) => api.get('/progress/activity', { params }),
};

// Leaderboard APIs
export const leaderboardAPI = {
  getLeaderboard: (params) => api.get('/leaderboard', { params }),
};

// Batch APIs
export const batchAPI = {
  getBatches: () => api.get('/batches'),
  getBatchById: (id) => api.get(`/batches/${id}`),
  createBatch: (data) => api.post('/batches', data),
  updateBatch: (id, data) => api.put(`/batches/${id}`, data),
  deleteBatch: (id) => api.delete(`/batches/${id}`),
};

// Admin Management APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStudents: (params) => api.get('/admin/students', { params }),
  getStudentDetail: (id, params) => api.get(`/admin/students/${id}`, { params }),
  syncStudent: (id, platform = 'all') => api.post(`/admin/students/${id}/sync`, { platform }),
  syncAll: () => api.post('/admin/sync-all'),
  getSyncMonitor: (params) => api.get('/admin/sync-monitor', { params }),
  getSystemHealth: () => api.get('/admin/system/sync-health'),
  getAdmins: () => api.get('/admin/admins'),
  createAdmin: (data) => api.post('/admin/admins', data),
  deleteAdmin: (id) => api.delete(`/admin/admins/${id}`),
};

// Reports APIs
export const reportAPI = {
  getWeeklyReport: (params) => api.get('/admin/reports/weekly', { params }),
  getMonthlyReport: (params) => api.get('/admin/reports/monthly', { params }),
};

// Notification APIs
export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  getAllNotifications: () => api.get('/notifications/all'),
  sendNotification: (data) => api.post('/notifications/send', data),
};

export default api;
