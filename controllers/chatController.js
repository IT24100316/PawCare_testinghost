const Message = require('../models/Message');
const Booking = require('../models/Booking');

const sendMessage = async (req, res) => {
  try {
    const { bookingId, receiver, text } = req.body;
    const sender = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (booking.status !== 'Approved') {
      return res.status(403).json({ message: 'Chat is disabled for this booking status' });
    }

    const message = await Message.create({
      bookingId,
      sender,
      receiver,
      text
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { bookingId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInbox = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving the user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 });

    // Group by bookingId
    const conversations = {};
    for (const msg of messages) {
      if (!conversations[msg.bookingId]) {
        conversations[msg.bookingId] = {
          bookingId: msg.bookingId,
          lastMessage: msg,
          unreadCount: 0
        };
      }
      if (msg.receiver.toString() === userId.toString() && !msg.isRead) {
        conversations[msg.bookingId].unreadCount++;
      }
    }

    // Convert to array and populate booking details
    const inbox = await Promise.all(
      Object.values(conversations).map(async (conv) => {
        const booking = await Booking.findById(conv.bookingId)
          .populate('userId', 'name')
          .populate('petId', 'name');
        
        // Find the other person's name
        const lastMsg = conv.lastMessage;
        const otherUserId = lastMsg.sender.toString() === userId.toString() ? lastMsg.receiver : lastMsg.sender;
        
        // This is a bit simplified, ideally we'd populate the user model
        return {
          ...conv,
          booking
        };
      })
    );

    res.status(200).json(inbox);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getMessages, markAsRead, getInbox };
