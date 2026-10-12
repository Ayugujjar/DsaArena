const mongoose = require('mongoose');

const dailyProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    leetcodeSolved: {
      type: Number,
      default: 0,
    },
    gfgSolved: {
      type: Number,
      default: 0,
    },
    totalSolved: {
      type: Number,
      default: 0,
    },
    cumulativeTotal: {
      type: Number,
      default: 0,
    },
    leetcodeTotal: {
      type: Number,
      default: 0,
    },
    leetcodeSnapshotInconsistent: {
      type: Boolean,
      default: false,
    },
    gfgTotal: {
      type: Number,
      default: 0,
    },
    gfgSnapshotInconsistent: {
      type: Boolean,
      default: false,
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
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one record per student per calendar date
dailyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyProgress', dailyProgressSchema);
