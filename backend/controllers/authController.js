const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Batch = require('../models/Batch');
const progressService = require('../services/progressService');
const emailService = require('../services/emailService');
const { validatePasswordStrength } = require('../utils/passwordValidator');
const { SESSION_DURATION_SECONDS, setSessionCookie, clearSessionCookie } = require('../utils/authCookies');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, version: user.tokenVersion }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: SESSION_DURATION_SECONDS,
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a student and queue any initial platform sync without delaying signup
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      batch = 'General',
      branch = 'CSE',
      college = '',
      leetcodeUsername = '',
      gfgUsername = '',
    } = req.body;

    if (![batch, branch, college, leetcodeUsername, gfgUsername].every((value) => typeof value === 'string')) {
      return res.status(400).json({ success: false, message: 'Profile fields must be strings' });
    }

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Password strength check
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return res.status(400).json({ success: false, message: strength.message });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists' });
    }

    // Resolve batchId if batch exists in DB
    const batchDoc = await Batch.findOne({ name: batch.trim() });

    const cleanLc = leetcodeUsername.trim().replace(/^@/, '');
    const cleanGfg = gfgUsername.trim().replace(/^@/, '');
    if (
      (cleanLc && !/^[A-Za-z0-9_-]{1,39}$/.test(cleanLc)) ||
      (cleanGfg && !/^[A-Za-z0-9_-]{1,50}$/.test(cleanGfg))
    ) {
      return res.status(400).json({ success: false, message: 'A platform username contains invalid characters' });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      batch: batchDoc ? batchDoc.name : batch.trim(),
      batchId: batchDoc ? batchDoc._id : null,
      branch: branch.trim(),
      college: college.trim(),
      leetcodeUsername: cleanLc,
      gfgUsername: cleanGfg,
      leetcodeConnected: !!cleanLc,
      gfgConnected: !!cleanGfg,
      status: 'active',
    });

    // Keep registration responsive; platform APIs may be slow or unavailable.
    if (user.leetcodeConnected || user.gfgConnected) {
      const userId = user._id.toString();
      console.info(JSON.stringify({
        event: 'new_student_initial_sync_started',
        userId,
        timestamp: new Date().toISOString(),
      }));
      progressService.syncStudent(user._id).catch(() => {
        console.error(JSON.stringify({
          event: 'new_student_initial_sync_failed',
          userId,
          category: 'sync_error',
          timestamp: new Date().toISOString(),
        }));
      });
    }

    const updatedUser = user;
    const token = generateToken(updatedUser);
    setSessionCookie(res, 'student_session', token);

    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        batch: updatedUser.batch,
        branch: updatedUser.branch,
        college: updatedUser.college,
        leetcodeUsername: updatedUser.leetcodeUsername,
        gfgUsername: updatedUser.gfgUsername,
        leetcodeConnected: updatedUser.leetcodeConnected,
        gfgConnected: updatedUser.gfgConnected,
        totalSolved: updatedUser.totalSolved,
        currentStreak: updatedUser.currentStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Student login with account lockout protection
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (
      email.length > 254 ||
      Buffer.byteLength(password, 'utf8') > 72 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Explicitly select password to compare
    const user = await User.findOne({ email: cleanEmail }).select(
      '+password +tokenVersion +failedLoginAttempts +lockUntil'
    );

    // Generic error to prevent account enumeration
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check account lockout
    if (user.isLocked()) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Successful login: reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = generateToken(user);
    setSessionCookie(res, 'student_session', token);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        batch: user.batch,
        branch: user.branch,
        college: user.college,
        leetcodeUsername: user.leetcodeUsername,
        gfgUsername: user.gfgUsername,
        leetcodeConnected: user.leetcodeConnected,
        gfgConnected: user.gfgConnected,
        totalSolved: user.totalSolved,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate secure cryptographic password reset token
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!emailService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Password reset email delivery is not configured. Please contact an administrator.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
      const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password/${rawToken}`;
      try {
        await emailService.sendPasswordResetEmail(user.email, resetUrl);
      } catch (emailError) {
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        console.error(JSON.stringify({
          event: 'password_reset_email_failed',
          userId: user._id.toString(),
          category: 'email_delivery',
          timestamp: new Date().toISOString(),
        }));
      }
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, reset instructions will be sent shortly.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using cryptographic one-time token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Invalid or missing reset token' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return res.status(400).json({ success: false, message: strength.message });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires +tokenVersion');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired' });
    }

    // Update password & clear token
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in student
 * @access  Private
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @route   POST /api/auth/logout
 * @desc    Student logout
 * @access  Private
 */
const logout = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  clearSessionCookie(res, 'student_session');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
};
