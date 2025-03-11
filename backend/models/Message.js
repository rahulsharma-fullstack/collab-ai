const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.Mixed,  // Can be ObjectId or string
    required: true
  },
  senderType: {
    type: String,
    required: true,
    enum: ['user', 'ai']
  },
  receiver: {
    type: mongoose.Schema.Types.Mixed,  // Can be ObjectId or string
    required: true
  },
  receiverType: {
    type: String,
    required: true,
    enum: ['user', 'ai']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isAI: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);