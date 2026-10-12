const mongoose = require('mongoose');

const problemActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['LeetCode', 'GeeksforGeeks', 'CodeChef', 'Codeforces'],
      required: true,
    },
    problemName: {
      type: String,
      required: true,
      trim: true,
    },
    problemSlug: {
      type: String,
      default: '',
    },
    problemUrl: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'School', 'Basic', 'Unknown'],
      default: 'Unknown',
    },
    solvedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

problemActivitySchema.index({ userId: 1, platform: 1, problemName: 1 }, { unique: true });

module.exports = mongoose.model('ProblemActivity', problemActivitySchema);
