const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
  },
  displayName: {
    type: String,
  },
  profilePhoto: {
    type: String,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
