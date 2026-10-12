const User = require('../models/User');
const Batch = require('../models/Batch');
const { validatePasswordStrength } = require('../utils/passwordValidator');
const { clearSessionCookie } = require('../utils/authCookies');

/**
 * @route   GET /api/users/profile
 * @desc    Get current student full profile
 * @access  Private (Student)
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update student profile details
 * @access  Private (Student)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, profileImage, branch, college, batch } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
        return res.status(400).json({ success: false, message: 'Name must contain 1 to 100 characters' });
      }
      user.name = name.trim();
    }

    if (profileImage !== undefined) {
      const validImageUrl =
        typeof profileImage === 'string' &&
        profileImage.length <= 2048 &&
        /^https:\/\/\S+$/i.test(profileImage);
      const validImageData =
        typeof profileImage === 'string' &&
        profileImage.length <= 2_800_000 &&
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(profileImage);
      if (profileImage !== '' && !validImageUrl && !validImageData) {
        return res.status(400).json({ success: false, message: 'Profile photo must be a PNG, JPEG, or WebP image up to 2 MB' });
      }
      user.profileImage = profileImage;
    }

    if (branch !== undefined) {
      if (typeof branch !== 'string' || branch.length > 100) {
        return res.status(400).json({ success: false, message: 'Branch must be 100 characters or fewer' });
      }
      user.branch = branch.trim();
    }

    if (college !== undefined) {
      if (typeof college !== 'string' || college.length > 150) {
        return res.status(400).json({ success: false, message: 'College must be 150 characters or fewer' });
      }
      user.college = college.trim();
    }

    if (batch && batch !== user.batch) {
      if (typeof batch !== 'string' || batch.length > 100) {
        return res.status(400).json({ success: false, message: 'Batch must be 100 characters or fewer' });
      }
      const batchDoc = await Batch.findOne({ name: batch });
      user.batch = batch;
      if (batchDoc) user.batchId = batchDoc._id;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        batch: user.batch,
        branch: user.branch,
        college: user.college,
        profileImage: user.profileImage,
        leetcodeUsername: user.leetcodeUsername,
        gfgUsername: user.gfgUsername,
        leetcodeConnected: user.leetcodeConnected,
        gfgConnected: user.gfgConnected,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/password
 * @desc    Update student password
 * @access  Private (Student)
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user._id).select('+password +tokenVersion');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return res.status(400).json({ success: false, message: strength.message });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.tokenVersion += 1;
    await user.save();
    clearSessionCookie(res, 'student_session');

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id/public
 * @desc    Get student public profile for leaderboards & peer viewing
 * @access  Public
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name batch branch college leetcodeUsername gfgUsername totalSolved weeklySolved monthlySolved dailySolved currentStreak longestStreak leetcodeStats gfgStats lastActive createdAt profileImage')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  getPublicProfile,
};
