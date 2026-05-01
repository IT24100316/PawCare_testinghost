const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative']
  },
  imageUrl: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
