const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['meeting', 'task', 'reminder', 'decision', 'general'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  originalMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  extractedDate: {
    type: Date,
    required: false
  },
  createdBy: {
    type: String,
    required: true
  },
  creatorType: {
    type: String,
    enum: ['user', 'ai'],
    default: 'user'
  }
}, { timestamps: true });

module.exports = mongoose.model('Memory', memorySchema);