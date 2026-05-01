const express = require('express');
const { addRecord, getRecordsByPet, updateRecord, deleteRecord } = require('../controllers/medicalRecordController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/pet/:petId', getRecordsByPet);
router.post('/', authorizeRoles('Vet'), addRecord);
router.put('/:id', authorizeRoles('Vet'), updateRecord);
router.delete('/:id', authorizeRoles('Vet'), deleteRecord);

module.exports = router;
