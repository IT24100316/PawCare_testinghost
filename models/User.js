const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long.']
  },
  phone: {
    type: String,
  },
  role: {
    type: String,
    enum: ['User', 'Vet', 'Groomer', 'BoardingManager', 'ShopOwner', 'Admin'],
    default: 'User',
  },
  profileImage: {
    type: String,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
