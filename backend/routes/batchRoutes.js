const express = require('express');
const router = express.Router();
const {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
} = require('../controllers/batchController');
const { protectAdmin, requireAdminOrAbove } = require('../middleware/adminMiddleware');
const { validateRequest } = require('../middleware/requestValidation');
const { batchCreateBody, batchUpdateBody, idParams } = require('../utils/requestSchemas');

// Public or student-accessible batch list
router.get('/', getBatches);
router.get('/:id', validateRequest({ params: idParams }), getBatchById);

// Admin batch management
router.post('/', validateRequest({ body: batchCreateBody }), protectAdmin, requireAdminOrAbove, createBatch);
router.put(
  '/:id',
  validateRequest({ params: idParams, body: batchUpdateBody }),
  protectAdmin,
  requireAdminOrAbove,
  updateBatch
);
router.delete('/:id', validateRequest({ params: idParams }), protectAdmin, requireAdminOrAbove, deleteBatch);

module.exports = router;
