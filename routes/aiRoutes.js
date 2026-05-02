const express = require('express');
const { analyzeSymptoms } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// POST /api/ai/analyze-symptoms
router.post('/analyze-symptoms', analyzeSymptoms);

module.exports = router;
