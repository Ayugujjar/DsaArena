const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 12,
      select: false, // Do not expose password hash in queries by default
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    profileImage: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student'],
      default: 'student',
    },
    batch: {
      type: String,
      trim: true,
      default: 'General',
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    branch: {
      type: String,
      default: 'CSE',
      trim: true,
    },
    college: {
      type: String,
      default: '',
      trim: true,
    },
    leetcodeUsername: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    gfgUsername: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    leetcodeConnected: {
      type: Boolean,
      default: false,
    },
    gfgConnected: {
      type: Boolean,
      default: false,
    },
    leetcodeSyncStatus: {
      type: String,
      enum: ['idle', 'in_progress', 'success', 'failed'],
      default: 'idle',
    },
    leetcodeLastSynced: {
      type: Date,
      default: null,
    },
    leetcodeLastError: {
      type: String,
      default: '',
    },
    leetcodeSyncAttempts: {
      type: Number,
      default: 0,
    },
    gfgSyncStatus: {
      type: String,
      enum: ['idle', 'in_progress', 'success', 'failed'],
      default: 'idle',
    },
    gfgLastSynced: {
      type: Date,
      default: null,
    },
    gfgLastError: {
      type: String,
      default: '',
    },
    gfgSyncAttempts: {
      type: Number,
      default: 0,
    },
    syncAttempts: {
      type: Number,
      default: 0,
    },
    leetcodeStats: {
      totalSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      acceptanceRate: { type: Number, default: 0 },
      lastSynced: { type: Date, default: null },
    },
    gfgStats: {
      totalSolved: { type: Number, default: 0 },
      schoolSolved: { type: Number, default: 0 },
      basicSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      codingScore: { type: Number, default: 0 },
      institutionRank: { type: Number, default: 0 },
      lastSynced: { type: Date, default: null },
    },
    // Baselines prevent counting previous historical solved problems as today's problems upon initial connection
    baselineLeetcodeTotal: {
      type: Number,
      default: -1,
    },
    baselineGfgTotal: {
      type: Number,
      default: -1,
    },
    totalSolved: {
      type: Number,
      default: 0,
      index: true,
    },
    dailySolved: {
      type: Number,
      default: 0,
    },
    weeklySolved: {
      type: Number,
      default: 0,
      index: true,
    },
    monthlySolved: {
      type: Number,
      default: 0,
      index: true,
    },
    easySolved: {
      type: Number,
      default: 0,
    },
    mediumSolved: {
      type: Number,
      default: 0,
    },
    hardSolved: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
    // Account lockout & security
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ batch: 1 });
userSchema.index({ totalSolved: -1 });
userSchema.index({ weeklySolved: -1 });
userSchema.index({ monthlySolved: -1 });

// Password hashing hook using cost factor 12
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is currently locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Activity status virtual
userSchema.virtual('activityStatus').get(function () {
  if (!this.lastActive) return 'never_active';
  const now = new Date();
  const diffHours = (now - new Date(this.lastActive)) / (1000 * 60 * 60);
  if (diffHours <= 24) return 'active_today';
  if (diffHours <= 168) return 'active_week';
  return 'inactive';
});

const removeSensitiveFields = (doc, result) => {
  delete result.password;
  delete result.tokenVersion;
  delete result.resetPasswordToken;
  delete result.resetPasswordExpires;
  delete result.failedLoginAttempts;
  delete result.lockUntil;
  return result;
};

userSchema.set('toJSON', { virtuals: true, transform: removeSensitiveFields });
userSchema.set('toObject', { virtuals: true, transform: removeSensitiveFields });

module.exports = mongoose.model('User', userSchema);
