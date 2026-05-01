const express = require('express');
const { getAvailableSlots, lockSlot, confirmBooking, cancelBooking, getAllVetBookings, updateBookingStatus } = require('../controllers/vetBookingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', authorizeRoles('Vet', 'Admin'), getAllVetBookings);
router.put('/:id/status', authorizeRoles('Vet', 'Admin'), updateBookingStatus);
router.get('/available', getAvailableSlots);
router.post('/lock', lockSlot);
router.post('/confirm', confirmBooking);
router.delete('/:id', cancelBooking);

module.exports = router;
