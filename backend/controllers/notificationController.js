const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current logged in student
 * @access  Private (Student)
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const user = req.user;
    const notifications = await Notification.find({
      $or: [
        { recipientType: 'all' },
        { recipientType: 'batch', batchName: user.batch },
        { recipientType: 'student', recipientId: user._id },
        { recipientType: 'students', recipientIds: user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const formatted = notifications.map((n) => ({
      ...n,
      isRead: (n.readBy || []).some((id) => id.toString() === user._id.toString()),
    }));

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    res.status(200).json({ success: true, notifications: formatted, unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark notification as read for student
 * @access  Private (Student)
 */
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notifications/send
 * @desc    Send announcement (Admin)
 * @access  Private (Admin)
 */
const sendNotification = async (req, res, next) => {
  try {
    const {
      recipientType = 'all',
      recipientId,
      recipientIds,
      batchName,
      title,
      message,
      type = 'announcement',
    } = req.body;

    if (
      typeof title !== 'string' ||
      typeof message !== 'string' ||
      !title.trim() ||
      !message.trim() ||
      title.length > 160 ||
      message.length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required; title must be 160 characters or less and message 5,000 or less',
      });
    }

    if (!['all', 'batch', 'student', 'students'].includes(recipientType)) {
      return res.status(400).json({ success: false, message: 'Invalid notification audience' });
    }

    if (recipientType === 'students') {
      const uniqueIds = Array.isArray(recipientIds) ? [...new Set(recipientIds)] : [];
      if (
        uniqueIds.length === 0 ||
        uniqueIds.length > 100 ||
        uniqueIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))
      ) {
        return res.status(400).json({
          success: false,
          message: 'Select between 1 and 100 valid students',
        });
      }

      const activeRecipients = await User.find({ _id: { $in: uniqueIds }, status: 'active' })
        .select('_id')
        .lean();
      if (activeRecipients.length !== uniqueIds.length) {
        return res.status(400).json({ success: false, message: 'One or more selected students are unavailable' });
      }

      const notification = await Notification.create({
        recipientType: 'students',
        recipientIds: activeRecipients.map((recipient) => recipient._id),
        title: title.trim(),
        message: message.trim(),
        type: 'announcement',
        senderName: req.admin.name || 'Platform Admin',
      });

      return res.status(201).json({
        success: true,
        message: `Message sent to ${activeRecipients.length} selected student${activeRecipients.length === 1 ? '' : 's'}`,
        notification,
      });
    }

    if (recipientType === 'batch' && (typeof batchName !== 'string' || !batchName.trim())) {
      return res.status(400).json({ success: false, message: 'Select a valid batch' });
    }

    if (recipientType === 'student') {
      if (typeof recipientId !== 'string' || !mongoose.isValidObjectId(recipientId)) {
        return res.status(400).json({ success: false, message: 'Select a valid student' });
      }
    }

    const notification = await Notification.create({
      recipientType,
      recipientId: recipientType === 'student' ? recipientId : null,
      batchName: recipientType === 'batch' ? batchName.trim() : null,
      title: title.trim(),
      message: message.trim(),
      type: 'announcement',
      senderName: req.admin.name || 'Platform Admin',
    });

    res.status(201).json({ success: true, message: 'Announcement sent successfully', notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications/all
 * @desc    Get all notifications for admin oversight
 * @access  Private (Admin)
 */
const getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  sendNotification,
  getAllNotifications,
};
