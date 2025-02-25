const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Plain text for simplicity; hash in production
});

module.exports = mongoose.model('User', userSchema);