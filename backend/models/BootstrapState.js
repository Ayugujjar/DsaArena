const mongoose = require('mongoose');

const bootstrapStateSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  pendingAdminName: {
    type: String,
    default: null,
  },
  pendingAdminEmail: {
    type: String,
    default: null,
  },
  setupCodeHash: {
    type: String,
    default: null,
    select: false,
  },
  setupCodeExpires: {
    type: Date,
    default: null,
    select: false,
  },
  setupCodeAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
});

module.exports = mongoose.model('BootstrapState', bootstrapStateSchema);
