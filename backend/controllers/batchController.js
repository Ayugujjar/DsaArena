const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const User = require('../models/User');

/**
 * @route   GET /api/batches
 * @desc    Get all batches with statistics
 * @access  Public / Protected
 */
const getBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 }).lean();

    // Attach student aggregates
    const batchesWithStats = await Promise.all(
      batches.map(async (batch) => {
        const students = await User.find({ batch: batch.name });
        const studentCount = students.length;
        const totalProblems = students.reduce((sum, s) => sum + (s.totalSolved || 0), 0);
        const leetcodeProblems = students.reduce((sum, s) => sum + (s.leetcodeStats?.totalSolved || 0), 0);
        const gfgProblems = students.reduce((sum, s) => sum + (s.gfgStats?.totalSolved || 0), 0);
        const avgProblems = studentCount > 0 ? Math.round(totalProblems / studentCount) : 0;

        // Active today count (activity within last 24h)
        const now = new Date();
        const activeToday = students.filter((s) => {
          if (!s.lastActive) return false;
          return (now - new Date(s.lastActive)) / (1000 * 60 * 60) <= 24;
        }).length;

        return {
          ...batch,
          studentCount,
          totalProblems,
          leetcodeProblems,
          gfgProblems,
          avgProblems,
          activeToday,
        };
      })
    );

    res.status(200).json({ success: true, batches: batchesWithStats });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/batches/:id
 * @desc    Get batch details with student roster
 * @access  Public / Protected
 */
const getBatchById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid batch identifier' });
    }
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const students = await User.find({ batch: batch.name })
      .select('-password')
      .sort({ totalSolved: -1 });

    const totalProblems = students.reduce((sum, s) => sum + (s.totalSolved || 0), 0);
    const avgProblems = students.length > 0 ? Math.round(totalProblems / students.length) : 0;

    res.status(200).json({
      success: true,
      batch,
      stats: {
        studentCount: students.length,
        totalProblems,
        avgProblems,
      },
      students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/batches
 * @desc    Create new batch
 * @access  Private (Admin)
 */
const createBatch = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
        (description !== undefined && (typeof description !== 'string' || description.length > 500))) {
      return res.status(400).json({ success: false, message: 'Provide a batch name (up to 100 characters) and description (up to 500 characters)' });
    }

    const existing = await Batch.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A batch with this name already exists' });
    }

    const batch = await Batch.create({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    res.status(201).json({ success: true, message: 'Batch created successfully', batch });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/batches/:id
 * @desc    Update batch
 * @access  Private (Admin)
 */
const updateBatch = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid batch identifier' });
    }
    if ((name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) ||
        (description !== undefined && (typeof description !== 'string' || description.length > 500)) ||
        (isActive !== undefined && typeof isActive !== 'boolean')) {
      return res.status(400).json({ success: false, message: 'Invalid batch update fields' });
    }
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const oldName = batch.name;
    if (name && name.trim()) batch.name = name.trim();
    if (description !== undefined) batch.description = description.trim();
    if (isActive !== undefined) batch.isActive = isActive;

    await batch.save();

    // If batch name changed, cascade update users
    if (name && name.trim() !== oldName) {
      await User.updateMany({ batch: oldName }, { $set: { batch: name.trim() } });
    }

    res.status(200).json({ success: true, message: 'Batch updated successfully', batch });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/batches/:id
 * @desc    Delete batch
 * @access  Private (Admin)
 */
const deleteBatch = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid batch identifier' });
    }
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const studentCount = await User.countDocuments({ batch: batch.name });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch '${batch.name}' because it contains ${studentCount} students. Reassign students first.`,
      });
    }

    await Batch.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
};
