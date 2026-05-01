const express = require('express');
const {
  getBoardingAvailability,
  getPetBookedDates,
  createBoardingBooking,
  cancelBooking,
  getAllBoardingBookings,
  updateBookingStatus,
} = require('../controllers/boardingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Manager / Admin routes
router.get('/', authorizeRoles('BoardingManager', 'Admin'), getAllBoardingBookings);
router.put('/:id/status', authorizeRoles('BoardingManager', 'Admin'), updateBookingStatus);

// User routes
router.get('/available', getBoardingAvailability);
router.get('/pet-dates', getPetBookedDates);
router.post('/book', createBoardingBooking);
router.delete('/:id', cancelBooking);

module.exports = router;
