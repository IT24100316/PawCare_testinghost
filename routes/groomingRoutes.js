const express = require('express');
const { getAvailableSlots, lockSlot, confirmBooking, cancelBooking, getAllGroomingBookings, updateBookingStatus } = require('../controllers/groomingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', authorizeRoles('Groomer', 'Admin'), getAllGroomingBookings);
router.put('/:id/status', authorizeRoles('Groomer', 'Admin'), updateBookingStatus);
router.get('/available', getAvailableSlots);
router.post('/lock', lockSlot);
router.post('/confirm', confirmBooking);
router.delete('/:id', cancelBooking);

module.exports = router;
