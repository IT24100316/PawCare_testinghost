const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
  },
  serviceType: {
    type: String,
    enum: ['Vet', 'Grooming', 'Boarding'],
    required: true,
  },
  appointmentDate: {
    type: Date,
    // Optional for Boarding — boardingDates array is used instead
  },
  timeSlot: {
    type: String,
    // Optional for Boarding — no time slots
  },
  boardingDates: {
    type: [Date],
    default: undefined,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
  },
  lockedUntil: {
    type: Date,
  },
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
