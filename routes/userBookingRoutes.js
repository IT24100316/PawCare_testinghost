const express = require('express');
const { getMyBookings, getBookingById } = require('../controllers/userBookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBookingById);

module.exports = router;
