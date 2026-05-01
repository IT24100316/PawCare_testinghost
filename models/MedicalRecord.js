const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vaccineName: String,
  dateGiven: Date,
  nextDueDate: Date,
  illnesses: String,
  treatments: String,
  allergies: String,
  doctorNotes: String,
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
module.exports = MedicalRecord;
