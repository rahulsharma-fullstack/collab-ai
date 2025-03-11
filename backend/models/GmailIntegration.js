const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption helper functions
const encrypt = (text) => {
  if (!text) return text;
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'your-encryption-key');
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (text) => {
  if (!text) return text;
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'your-encryption-key');
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const gmailIntegrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessToken: {
    type: String,
    required: true,
    set: encrypt,
    get: decrypt
  },
  refreshToken: {
    type: String,
    required: true,
    set: encrypt,
    get: decrypt
  },
  expiryDate: {
    type: Date,
    required: true
  },
  email: {
    type: String,
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('GmailIntegration', gmailIntegrationSchema); 