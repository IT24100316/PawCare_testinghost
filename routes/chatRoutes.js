const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', sendMessage);
router.get('/:bookingId', getMessages);

module.exports = router;
