const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  encryptedContent: {
    type: String,
    required: true
  },
  algorithm: {
    type: String,
    required: true,
    enum: ['AES-256', 'Triple-DES', 'Vigenere-Cipher']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  },
  maxViews: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  viewCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Message', messageSchema);
