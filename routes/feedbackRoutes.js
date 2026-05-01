const express = require('express');
const { submitFeedback, getAllFeedback, getAverageRatings, updateFeedback, deleteFeedback } = require('../controllers/feedbackController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', submitFeedback);
router.get('/', getAllFeedback);
router.get('/average', getAverageRatings);
router.put('/:id', updateFeedback);
router.delete('/:id', authorizeRoles('Admin'), deleteFeedback);

module.exports = router;
