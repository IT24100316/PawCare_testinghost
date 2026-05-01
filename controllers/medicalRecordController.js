const MedicalRecord = require('../models/MedicalRecord');

const addRecord = async (req, res) => {
  try {
    const newRecord = await MedicalRecord.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecordsByPet = async (req, res) => {
  try {
    const { petId } = req.params;
    const records = await MedicalRecord.find({ petId, isDeleted: false });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    if (!updatedRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await MedicalRecord.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    res.status(200).json({ message: 'Record soft deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addRecord, getRecordsByPet, updateRecord, deleteRecord };
