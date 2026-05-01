const Feedback = require('../models/Feedback');

const submitFeedback = async (req, res) => {
  try {
    const { serviceType, rating, comment } = req.body;
    
    const newFeedback = await Feedback.create({
      userId: req.user._id,
      serviceType,
      rating,
      comment
    });
    
    res.status(201).json(newFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const { serviceType } = req.query;
    let query = {};
    
    if (serviceType) {
      query.serviceType = serviceType;
    }
    
    const feedbacks = await Feedback.find(query);
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAverageRatings = async (req, res) => {
  try {
    const aggregationResult = await Feedback.aggregate([
      {
        $group: {
          _id: "$serviceType",
          averageRating: { $avg: "$rating" },
          totalFeedbacks: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json(aggregationResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    if (feedback.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this feedback' });
    }
    
    feedback.rating = rating !== undefined ? rating : feedback.rating;
    feedback.comment = comment !== undefined ? comment : feedback.comment;
    
    await feedback.save();
    
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    await Feedback.findByIdAndDelete(id);
    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitFeedback, getAllFeedback, getAverageRatings, updateFeedback, deleteFeedback };
