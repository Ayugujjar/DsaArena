const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const BootstrapState = require('../models/BootstrapState');
const { validatePasswordStrength } = require('../utils/passwordValidator');
const { SESSION_DURATION_SECONDS, setSessionCookie, clearSessionCookie } = require('../utils/authCookies');

const getAllowedSetupEmail = () => {
  const email = process.env.ADMIN_SETUP_EMAIL;
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? email.toLowerCase().trim()
    : null;
};

const isLocalDevelopmentRequest = (req) => {
  const address = req.socket.remoteAddress?.replace(/^::ffff:/, '');
  return process.env.NODE_ENV === 'development' && (address === '127.0.0.1' || address === '::1');
};

const hashSetupCode = (email, code) =>
  crypto.createHmac('sha256', process.env.ADMIN_JWT_SECRET).update(`${email}:${code}`).digest();

const generateAdminToken = (admin) => {
  return jwt.sign({ id: admin._id, version: admin.tokenVersion }, process.env.ADMIN_JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: SESSION_DURATION_SECONDS,
  });
};

/**
 * @route   GET /api/admin/auth/setup-status
 * @desc    Check if platform requires initial Super Admin setup
 * @access  Public
 */
const checkSetupStatus = async (req, res, next) => {
  try {
    const [adminCount, bootstrapState] = await Promise.all([
      Admin.countDocuments(),
      BootstrapState.findById('initial-admin-setup').select('+setupCodeHash +setupCodeExpires'),
    ]);
    const setupRequired = adminCount === 0 && !bootstrapState?.completedAt;
    const setupCodeAvailable = !!getAllowedSetupEmail() || isLocalDevelopmentRequest(req);
    res.status(200).json({
      success: true,
      setupRequired,
      setupAvailable: setupRequired && setupCodeAvailable,
      setupCodeAvailable,
      codePending: !!(
        setupRequired &&
        bootstrapState?.setupCodeHash &&
        bootstrapState.setupCodeExpires > new Date()
      ),
      adminCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/auth/setup
 * @desc    Generate an initial administrator verification code in the backend terminal
 * @access  Public (rate limited; setup email must match ADMIN_SETUP_EMAIL)
 */
const requestInitialAdminCode = async (req, res, next) => {
  try {
    const allowedEmail = getAllowedSetupEmail();
    const localDevelopmentRequest = isLocalDevelopmentRequest(req);
    if (!allowedEmail && !localDevelopmentRequest) {
      return res.status(503).json({
        success: false,
        message: 'Initial admin setup is unavailable. Configure ADMIN_SETUP_EMAIL on the server.',
      });
    }

    const { name, email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    if (allowedEmail && cleanEmail !== allowedEmail) {
      return res.status(403).json({ success: false, message: 'This email is not authorized for initial administrator setup' });
    }
    if (!name.trim() || name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Please provide a valid administrator name' });
    }

    await Admin.createIndexes();
    const [adminCount, bootstrapState] = await Promise.all([
      Admin.countDocuments(),
      BootstrapState.findById('initial-admin-setup').select('+setupCodeHash +setupCodeExpires'),
    ]);
    if (adminCount > 0 || bootstrapState?.completedAt) {
      return res.status(403).json({
        success: false,
        message: 'Platform setup has already been completed. Contact an existing Super Admin.',
      });
    }
    const codeIsPending = bootstrapState?.setupCodeExpires > new Date();
    if (codeIsPending && !localDevelopmentRequest) {
      return res.status(429).json({
        success: false,
        message: 'A setup code was already generated and is still valid. Check the backend terminal.',
      });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashSetupCode(cleanEmail, code).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const issueFilter = {
      _id: 'initial-admin-setup',
      completedAt: null,
    };
    if (codeIsPending) {
      issueFilter.setupCodeHash = bootstrapState.setupCodeHash;
      issueFilter.setupCodeExpires = bootstrapState.setupCodeExpires;
    } else {
      issueFilter.$or = [
        { setupCodeExpires: null },
        { setupCodeExpires: { $lte: new Date() } },
      ];
    }
    const pendingState = await BootstrapState.findOneAndUpdate(
      issueFilter,
      {
        $set: {
          pendingAdminName: name.trim(),
          pendingAdminEmail: cleanEmail,
          setupCodeHash: codeHash,
          setupCodeExpires: expiresAt,
          setupCodeAttempts: 0,
        },
        $setOnInsert: { _id: 'initial-admin-setup' },
      },
      { upsert: true, new: true, runValidators: true }
    );
    if (!pendingState) {
      return res.status(429).json({
        success: false,
        message: 'A setup code was already generated and is still valid. Check the backend terminal.',
      });
    }

    console.info(`[Admin Setup] Initial admin code: ${code} (expires in 10 minutes)`);

    res.set('Cache-Control', 'no-store').status(200).json({
      success: true,
      message: localDevelopmentRequest
        ? 'A six-digit setup code was generated. It expires in 10 minutes.'
        : 'A six-digit setup code was printed in the backend terminal. It expires in 10 minutes.',
      ...(localDevelopmentRequest ? { setupCode: code } : {}),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(429).json({
        success: false,
        message: 'A setup code was recently generated. Check the backend terminal.',
      });
    }
    next(error);
  }
};

/**
 * @route   POST /api/admin/auth/setup/verify
 * @desc    Verify the one-time setup code and initialize the first Super Admin
 * @access  Public (rate limited; one-time setup code required)
 */
const verifyInitialAdminCode = async (req, res, next) => {
  try {
    const allowedEmail = getAllowedSetupEmail();
    const localDevelopmentRequest = isLocalDevelopmentRequest(req);
    const { name, email, code, password, confirmPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    if ((!allowedEmail && !localDevelopmentRequest) || (allowedEmail && cleanEmail !== allowedEmail)) {
      return res.status(400).json({ success: false, message: 'The verification code is invalid or expired' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return res.status(400).json({ success: false, message: strength.message });
    }

    const state = await BootstrapState.findById('initial-admin-setup')
      .select('+setupCodeHash +setupCodeExpires +setupCodeAttempts');
    if (
      !state ||
      state.completedAt ||
      state.pendingAdminEmail !== cleanEmail ||
      state.pendingAdminName !== name.trim() ||
      !state.setupCodeHash ||
      !state.setupCodeExpires ||
      state.setupCodeExpires <= new Date() ||
      state.setupCodeAttempts >= 5
    ) {
      return res.status(400).json({ success: false, message: 'The verification code is invalid or expired' });
    }

    const expectedHash = Buffer.from(state.setupCodeHash, 'hex');
    const suppliedHash = hashSetupCode(cleanEmail, code);
    if (expectedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(expectedHash, suppliedHash)) {
      await BootstrapState.updateOne(
        {
          _id: state._id,
          setupCodeHash: state.setupCodeHash,
          setupCodeAttempts: { $lt: 5 },
          setupCodeExpires: { $gt: new Date() },
        },
        { $inc: { setupCodeAttempts: 1 } }
      );
      return res.status(400).json({ success: false, message: 'The verification code is invalid or expired' });
    }

    const superAdmin = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'Super Admin',
      isInitialAdmin: true,
      permissions: ['manage_admins', 'view_students', 'view_reports', 'manage_batches', 'delete_records', 'system_health'],
    });
    const completion = await BootstrapState.updateOne(
      {
        _id: state._id,
        completedAt: null,
        setupCodeHash: state.setupCodeHash,
        setupCodeExpires: { $gt: new Date() },
        setupCodeAttempts: { $lt: 5 },
      },
      {
        $set: { completedAt: new Date() },
        $unset: {
          pendingAdminName: 1,
          pendingAdminEmail: 1,
          setupCodeHash: 1,
          setupCodeExpires: 1,
        },
      }
    );
    if (!completion.modifiedCount) {
      await Admin.deleteOne({ _id: superAdmin._id });
      return res.status(400).json({ success: false, message: 'The verification code is invalid or expired' });
    }

    setSessionCookie(res, 'admin_session', generateAdminToken(superAdmin));
    res.status(201).json({
      success: true,
      message: 'Super Administrator initialized successfully. The setup code can no longer be used.',
      admin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        permissions: superAdmin.permissions,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Platform setup has already been completed.' });
    }
    next(error);
  }
};

/**
 * @route   POST /api/admin/auth/setup-password/:token
 * @desc    Set an admin password using a one-time invitation link
 * @access  Public
 */
const setupAdminPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ success: false, message: 'This setup link is invalid or has expired' });
    }
    if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter and confirm your password' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return res.status(400).json({ success: false, message: strength.message });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const admin = await Admin.findOneAndUpdate({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }, {
      $set: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
      $inc: { tokenVersion: 1 },
    }, {
      new: true,
      runValidators: true,
    });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'This setup link is invalid or has expired' });
    }

    res.status(200).json({
      success: true,
      message: 'Password set successfully. You can now sign in to the administrator portal.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/auth/login
 * @desc    Admin login with security lockouts
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    if (email.length > 254 || Buffer.byteLength(password, 'utf8') > 72 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail }).select(
      '+password +tokenVersion +failedLoginAttempts +lockUntil'
    );

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    if (admin.isLocked()) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await admin.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    const token = generateAdminToken(admin);
    setSessionCookie(res, 'admin_session', token);

    res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/auth/me
 * @desc    Get logged in admin profile
 * @access  Private (Admin)
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin,
  });
};

/**
 * @route   POST /api/admin/auth/logout
 * @desc    Admin logout
 * @access  Private (Admin)
 */
const logout = async (req, res) => {
  await Admin.updateOne({ _id: req.admin._id }, { $inc: { tokenVersion: 1 } });
  clearSessionCookie(res, 'admin_session');
  res.status(200).json({
    success: true,
    message: 'Admin logged out successfully',
  });
};

module.exports = {
  checkSetupStatus,
  requestInitialAdminCode,
  verifyInitialAdminCode,
  setupAdminPassword,
  login,
  getMe,
  logout,
};
