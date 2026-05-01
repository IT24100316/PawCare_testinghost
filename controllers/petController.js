const Pet = require('../models/Pet');

const addPet = async (req, res) => {
  try {
    const { name, species, breed, age, image, medicalNotes } = req.body;
    
    const newPet = await Pet.create({
      ownerId: req.user._id,
      name,
      species,
      breed,
      age,
      image,
      medicalNotes
    });
    
    res.status(201).json(newPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPets = async (req, res) => {
  try {
    const pets = await Pet.find({ ownerId: req.user._id });
    res.status(200).json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const pet = await Pet.findById(petId);
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    if (pet.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this pet' });
    }
    
    const updatedPet = await Pet.findByIdAndUpdate(
      petId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const pet = await Pet.findById(petId);
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    if (pet.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this pet' });
    }
    
    await Pet.findByIdAndDelete(petId);
    res.status(200).json({ message: 'Pet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addPet, getPets, getPetById, updatePet, deletePet };
