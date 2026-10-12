const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  sendNotification,
  getAllNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { protectAdmin, requireAdminOrAbove } = require('../middleware/adminMiddleware');
const { validateRequest } = require('../middleware/requestValidation');
const { idParams, notificationBody } = require('../utils/requestSchemas');

// Student notifications
router.get('/', protect, getMyNotifications);
router.post('/:id/read', validateRequest({ params: idParams }), protect, markAsRead);

// Admin broadcasts
router.get('/all', protectAdmin, getAllNotifications);
router.post(
  '/send',
  validateRequest({ body: notificationBody }),
  protectAdmin,
  requireAdminOrAbove,
  sendNotification
);

module.exports = router;
