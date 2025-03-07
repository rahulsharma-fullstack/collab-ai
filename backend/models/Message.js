const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isAI: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', messageSchema);