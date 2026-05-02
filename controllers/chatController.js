const Message = require('../models/Message');
const Booking = require('../models/Booking');

const sendMessage = async (req, res) => {
  try {
    const { bookingId, receiver, text } = req.body;
    const sender = req.user._id;

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

module.exports = { sendMessage, getMessages };
