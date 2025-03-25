const mongoose = require('mongoose');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // Replace with your secure key
const iv = crypto.randomBytes(16); // Replace with your secure IV

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (encryptedText) => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
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
    required: true
    // Encryption should be handled externally
  },
  refreshToken: {
    type: String,
    required: true
    // Encryption should be handled externally
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

// Remove encryption/decryption logic from the schema
// Handle encryption/decryption in the application logic

module.exports = mongoose.model('GmailIntegration', gmailIntegrationSchema);