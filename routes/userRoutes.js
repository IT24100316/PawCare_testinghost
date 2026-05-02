const express = require('express');
const { getProfile, updateProfile, changePassword, getVetUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/vet', getVetUser);

module.exports = router;
