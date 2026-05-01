const express = require('express');
const { getAllUsers, blockUser, createServiceProvider } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('Admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/block', blockUser);
router.post('/providers', createServiceProvider);

module.exports = router;
