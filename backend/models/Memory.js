const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['meeting', 'deadline', 'decision', 'other'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  originalMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  date: {
    type: Date,
    required: false
  },
  extractedDate: {
    type: Date,
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  creatorType: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Memory', memorySchema); 