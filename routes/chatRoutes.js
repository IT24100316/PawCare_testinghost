const express = require('express');
const { sendMessage, getMessages, getInbox, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', sendMessage);
router.get('/inbox', getInbox);
router.get('/:bookingId', getMessages);
router.put('/:bookingId/read', markAsRead);

module.exports = router;
