const Booking = require('../models/Booking');

const MAX_BOARDING_CAPACITY = 20;

// GET /bookings/boarding/available?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
const getBoardingAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    // Find all approved bookings that overlap this date range
    const existingBookings = await Booking.find({
      serviceType: 'Boarding',
      status: 'Approved',
      boardingDates: { $elemMatch: { $gte: start, $lte: end } },
    });

    // Build a count map: { 'YYYY-MM-DD': count }
    const capacityMap = {};
    existingBookings.forEach(booking => {
      if (booking.boardingDates) {
        booking.boardingDates.forEach(date => {
          const d = new Date(date);
          if (d >= start && d <= end) {
            const dateStr = d.toISOString().split('T')[0];
            capacityMap[dateStr] = (capacityMap[dateStr] || 0) + 1;
          }
        });
      }
    });

    // Build a result array for each day in the range
    const result = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const count = capacityMap[dateStr] || 0;
      result.push({
        date: dateStr,
        status: count >= MAX_BOARDING_CAPACITY ? 'full' : 'available',
        count,
      });
      current.setDate(current.getDate() + 1);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /bookings/boarding/book
const createBoardingBooking = async (req, res) => {
  try {
    const { petId, boardingDates } = req.body;
    if (!petId || !boardingDates || !boardingDates.length) {
      return res.status(400).json({ message: 'petId and boardingDates array are required' });
    }

    const parsedDates = boardingDates.map(d => {
      const date = new Date(d);
      date.setUTCHours(12, 0, 0, 0); // noon UTC avoids timezone boundary issues
      return date;
    });

    // ── Duplicate check: same pet cannot book dates it already has (Pending or Approved) ──
    for (const date of parsedDates) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const conflict = await Booking.findOne({
        petId,
        serviceType: 'Boarding',
        status: { $in: ['Pending', 'Approved'] },
        boardingDates: { $elemMatch: { $gte: startOfDay, $lte: endOfDay } },
      });

      if (conflict) {
        const dateStr = startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        return res.status(400).json({
          message: `This pet already has a boarding booking on ${dateStr}. Please choose different dates.`,
        });
      }
    }

    const newBooking = await Booking.create({
      userId: req.user._id,
      petId,
      serviceType: 'Boarding',
      boardingDates: parsedDates,
      status: 'Pending',
      appointmentDate: parsedDates[0], // kept for backward compat
      timeSlot: 'N/A',
    });

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      newBooking.userId,
      'Boarding Request Received',
      `Your Boarding request for ${parsedDates.length} day(s) has been received and is pending approval.`
    );

    res.status(201).json({ message: 'Booking created', booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE /bookings/boarding/:id
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // For boarding, check if the first day has already started
    const firstDay = booking.boardingDates && booking.boardingDates.length > 0
      ? new Date(booking.boardingDates[0])
      : new Date(booking.appointmentDate);

    firstDay.setUTCHours(0, 0, 0, 0);
    if (firstDay - new Date() < 0) {
      return res.status(400).json({ message: 'Cannot cancel an ongoing or past boarding stay' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      booking.userId,
      'Boarding Cancelled',
      `Your Boarding request has been cancelled.`
    );

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /bookings/boarding  (BoardingManager / Admin only)
const getAllBoardingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ serviceType: 'Boarding' })
      .populate('petId', 'name species')
      .populate('userId', 'name email');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /bookings/boarding/:id/status  (BoardingManager / Admin only)
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Capacity check before approving
    if (status === 'Approved' && booking.boardingDates && booking.boardingDates.length > 0) {
      for (const date of booking.boardingDates) {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const dailyApprovedCount = await Booking.countDocuments({
          serviceType: 'Boarding',
          status: 'Approved',
          _id: { $ne: id }, // exclude this booking itself
          boardingDates: { $elemMatch: { $gte: startOfDay, $lte: endOfDay } },
        });

        if (dailyApprovedCount >= MAX_BOARDING_CAPACITY) {
          const dateStr = startOfDay.toISOString().split('T')[0];
          return res.status(400).json({
            message: `Cannot approve: Boarding house is full on ${dateStr} (max ${MAX_BOARDING_CAPACITY} pets/day)`,
          });
        }
      }
    }

    booking.status = status;
    await booking.save();

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      booking.userId,
      `Boarding ${status}`,
      `Your Boarding request has been ${status.toLowerCase()}.`
    );

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /bookings/boarding/pet-dates?petId=xxx
// Returns all boardingDates for a given pet that are Pending or Approved
const getPetBookedDates = async (req, res) => {
  try {
    const { petId } = req.query;
    if (!petId) return res.status(400).json({ message: 'petId is required' });

    const bookings = await Booking.find({
      petId,
      serviceType: 'Boarding',
      status: { $in: ['Pending', 'Approved'] },
    }).select('boardingDates status');

    // Flatten all dates and tag each with its status
    const dates = [];
    bookings.forEach(b => {
      if (b.boardingDates) {
        b.boardingDates.forEach(d => {
          dates.push({
            date: new Date(d).toISOString().split('T')[0],
            status: b.status,
          });
        });
      }
    });

    res.status(200).json(dates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBoardingAvailability,
  getPetBookedDates,
  createBoardingBooking,
  cancelBooking,
  getAllBoardingBookings,
  updateBookingStatus,
};
