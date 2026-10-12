const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 12,
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Moderator'],
      default: 'Admin',
    },
    isInitialAdmin: {
      type: Boolean,
      default: false,
      select: false,
    },
    permissions: {
      type: [String],
      default: ['view_students', 'view_reports', 'manage_batches'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
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

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

adminSchema.index(
  { isInitialAdmin: 1 },
  { unique: true, partialFilterExpression: { isInitialAdmin: true } }
);

const removeSensitiveFields = (doc, result) => {
  delete result.password;
  delete result.tokenVersion;
  delete result.resetPasswordToken;
  delete result.resetPasswordExpires;
  delete result.failedLoginAttempts;
  delete result.lockUntil;
  return result;
};

adminSchema.set('toJSON', { transform: removeSensitiveFields });
adminSchema.set('toObject', { transform: removeSensitiveFields });

module.exports = mongoose.model('Admin', adminSchema);
