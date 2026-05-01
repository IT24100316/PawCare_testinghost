const Booking = require('../models/Booking');

const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const searchDate = new Date(date);
    
    const startOfDay = new Date(searchDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(searchDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const standardSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

    const existingBookings = await Booking.find({
      serviceType: 'Vet',
      appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    });

    // A slot is occupied when:
    //  - status is Approved or Rejected (final states), OR
    //  - status is Pending AND petId is set (booking confirmed, awaiting vet approval), OR
    //  - status is Pending AND lockedUntil is still in the future (active TTL lock)
    const activeBookings = existingBookings.filter(b => {
      if (b.status === 'Cancelled') return false;        // cancelled → free
      if (b.status !== 'Pending')   return true;         // Approved/Rejected → occupied
      if (b.petId)                  return true;         // confirmed booking → occupied
      return b.lockedUntil && b.lockedUntil > Date.now(); // live TTL lock → occupied
    });

    const bookedOrLockedSlots = activeBookings.map(b => b.timeSlot);
    
    const availableSlots = standardSlots
      .filter(slot => !bookedOrLockedSlots.includes(slot))
      .map(slot => ({
        time: slot
      }));

    res.status(200).json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const lockSlot = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'Date and timeSlot are required' });
    }

    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingBooking = await Booking.findOne({
      serviceType: 'Vet',
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      $or: [
        { status: { $ne: 'Cancelled' } },
        { lockedUntil: { $gt: Date.now() } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Slot is already booked or locked' });
    }

    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);

    const newBooking = await Booking.create({
      userId: req.user._id,
      serviceType: 'Vet',
      appointmentDate,
      timeSlot,
      lockedUntil,
      status: 'Pending'
    });

    res.status(201).json({ bookingId: newBooking._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmBooking = async (req, res) => {
  try {
    const { bookingId, petId } = req.body;

    if (!bookingId || !petId) {
      return res.status(400).json({ message: 'bookingId and petId are required' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    if (booking.lockedUntil && new Date(booking.lockedUntil) < new Date()) {
      return res.status(400).json({ message: 'Lock expired' });
    }

    booking.petId = petId;
    booking.lockedUntil = undefined;
    booking.status = 'Pending';

    await booking.save();

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      booking.userId,
      'Booking Confirmed',
      `Your Vet appointment on ${new Date(booking.appointmentDate).toLocaleDateString('en-US', { timeZone: 'UTC' })} at ${booking.timeSlot} is confirmed and pending approval.`
    );

    res.status(200).json({ message: 'Booking confirmed', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to cancel booking' });
    }


    const [hours, minutes] = booking.timeSlot.split(':');
    const appointmentTime = new Date(booking.appointmentDate);
    appointmentTime.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const diffInMilliseconds = appointmentTime - new Date();
    const twoHoursInMilliseconds = 2 * 60 * 60 * 1000;

    if (diffInMilliseconds < twoHoursInMilliseconds) {
      return res.status(400).json({ message: 'Cannot cancel within 2 hours' });
    }

    booking.status = 'Cancelled';
    booking.lockedUntil = undefined;
    await booking.save();

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      booking.userId,
      'Booking Cancelled',
      `Your Vet appointment on ${new Date(booking.appointmentDate).toLocaleDateString('en-US', { timeZone: 'UTC' })} at ${booking.timeSlot} has been cancelled.`
    );

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllVetBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ serviceType: 'Vet' })
      .populate('petId')
      .populate('userId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      booking.userId,
      `Booking ${status}`,
      `Your Vet appointment on ${new Date(booking.appointmentDate).toLocaleDateString('en-US', { timeZone: 'UTC' })} at ${booking.timeSlot} has been ${status.toLowerCase()}.`
    );

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAvailableSlots, lockSlot, confirmBooking, cancelBooking, getAllVetBookings, updateBookingStatus };
