const express = require('express');
const { getMyBookings } = require('../controllers/userBookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/my-bookings', getMyBookings);

module.exports = router;
