const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const crypto = require('crypto');

// In-memory fallback store if MongoDB is not connected
const inMemoryStore = new Map();

// Helper to generate unique 8-character ID
function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

// POST /api/messages - Create a new encrypted message
router.post('/', async (req, res) => {
  try {
    const { encryptedContent, algorithm, expiryMinutes, maxViews, customId } = req.body;

    if (!encryptedContent || !algorithm) {
      return res.status(400).json({ error: 'Encrypted content and algorithm are required' });
    }

    let messageId;
    if (customId && customId.trim()) {
      messageId = customId.trim().replace(/[^a-zA-Z0-9_-]/g, ''); // sanitize
      if (messageId.length < 3) {
        return res.status(400).json({ error: 'Custom Message ID must be at least 3 characters long.' });
      }

      // Check if custom ID already exists in DB
      if (req.isDbConnected) {
        const existing = await Message.findOne({ messageId });
        if (existing) {
          return res.status(400).json({ error: 'This Message ID is already in use. Please choose another one.' });
        }
      }

      // Check if custom ID exists in in-memory store
      if (inMemoryStore.has(messageId)) {
        return res.status(400).json({ error: 'This Message ID is already in use. Please choose another one.' });
      }
    } else {
      messageId = generateId();
    }

    let expiresAt = null;
    if (expiryMinutes && parseInt(expiryMinutes) > 0) {
      expiresAt = new Date(Date.now() + parseInt(expiryMinutes) * 60 * 1000);
    }

    const messageData = {
      messageId,
      encryptedContent,
      algorithm,
      createdAt: new Date(),
      expiresAt,
      maxViews: maxViews ? parseInt(maxViews) : 0,
      viewCount: 0
    };

    // Try MongoDB first
    try {
      if (req.isDbConnected) {
        const newMessage = new Message(messageData);
        await newMessage.save();
      } else {
        inMemoryStore.set(messageId, messageData);
      }
    } catch (dbErr) {
      console.log('Using in-memory fallback store...');
      inMemoryStore.set(messageId, messageData);
    }

    res.status(201).json({
      success: true,
      messageId: messageId,
      algorithm: algorithm,
      expiresAt: expiresAt
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Server error while saving message' });
  }
});

// GET /api/messages/:id - Fetch an encrypted message by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let message = null;

    // Check MongoDB if connected
    if (req.isDbConnected) {
      message = await Message.findOne({ messageId: id });
    }

    // Fallback to in-memory store if not found in DB
    if (!message && inMemoryStore.has(id)) {
      message = inMemoryStore.get(id);
    }

    if (!message) {
      return res.status(404).json({ error: 'Message not found or has expired' });
    }

    // Check if expired
    if (message.expiresAt && new Date() > new Date(message.expiresAt)) {
      if (req.isDbConnected) {
        await Message.deleteOne({ messageId: id });
      }
      inMemoryStore.delete(id);
      return res.status(410).json({ error: 'This message has expired and is no longer available' });
    }

    // Check max views
    if (message.maxViews > 0 && message.viewCount >= message.maxViews) {
      if (req.isDbConnected) {
        await Message.deleteOne({ messageId: id });
      }
      inMemoryStore.delete(id);
      return res.status(410).json({ error: 'This message reached its maximum view limit and was burned' });
    }

    // Increment view count
    message.viewCount = (message.viewCount || 0) + 1;
    if (req.isDbConnected && message.save) {
      await message.save();
    }

    res.json({
      success: true,
      messageId: message.messageId,
      encryptedContent: message.encryptedContent,
      algorithm: message.algorithm,
      createdAt: message.createdAt,
      viewCount: message.viewCount,
      maxViews: message.maxViews
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Server error while fetching message' });
  }
});

module.exports = router;
