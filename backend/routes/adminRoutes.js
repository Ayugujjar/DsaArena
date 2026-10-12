const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protectAdmin, requireSuperAdmin, requireAdminOrAbove } = require('../middleware/adminMiddleware');
const { validateRequest } = require('../middleware/requestValidation');
const {
  adminCreateBody,
  adminStudentDetailQuery,
  adminStudentsQuery,
  adminSyncMonitorQuery,
  idParams,
  syncStudentBody,
} = require('../utils/requestSchemas');

// Dashboard overview (all admin roles)
router.get('/dashboard', protectAdmin, getAdminDashboard);

// System telemetry & sync monitor
router.get('/sync-monitor', validateRequest({ query: adminSyncMonitorQuery }), protectAdmin, getSyncMonitor);
router.get('/system/health', protectAdmin, getSystemHealth);
router.get('/system/sync-health', protectAdmin, getSystemHealth);

// Student management
router.get('/students', validateRequest({ query: adminStudentsQuery }), protectAdmin, getStudents);
router.get(
  '/students/:id',
  validateRequest({ params: idParams, query: adminStudentDetailQuery }),
  protectAdmin,
  getStudentDetail
);
router.post(
  '/students/:id/sync',
  validateRequest({ params: idParams, body: syncStudentBody }),
  protectAdmin,
  requireAdminOrAbove,
  syncStudentOnDemand
);
router.post('/sync-all', protectAdmin, requireAdminOrAbove, syncAllStudents);

// Admin team management (Super Admin only)
router.get('/admins', protectAdmin, requireSuperAdmin, getAdmins);
router.post(
  '/admins',
  validateRequest({ body: adminCreateBody }),
  protectAdmin,
  requireSuperAdmin,
  createAdmin
);
router.delete(
  '/admins/:id',
  validateRequest({ params: idParams }),
  protectAdmin,
  requireSuperAdmin,
  deleteAdmin
);

module.exports = router;
