const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updatePassword, getPublicProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/requestValidation');
const { idParams, profileBody, userPasswordBody } = require('../utils/requestSchemas');

router.get('/profile', protect, getProfile);
router.put('/profile', validateRequest({ body: profileBody }), protect, updateProfile);
router.put('/password', validateRequest({ body: userPasswordBody }), protect, updatePassword);
router.get('/:id/public', validateRequest({ params: idParams }), getPublicProfile);

module.exports = router;
