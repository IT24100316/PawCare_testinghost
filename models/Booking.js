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
  // Grooming-specific fields
  subService: {
    type: String, // e.g. "Full Groom", "Bath & Brush"
  },
  price: {
    type: Number,
  },
  addOns: {
    type: [String], // e.g. ["Nail Trimming", "Ear Cleaning"]
    default: undefined,
  },
  petMood: {
    type: String,
    enum: ['Calm', 'Nervous', 'Aggressive'],
  },
  lastGroomingDate: {
    type: Date,
  },
  notes: {
    type: String, // Special instructions from user
  },
  symptoms: {
    type: String, // Pre-visit symptoms/concerns
  },
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
