const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory P2P active room signaling store
// { roomId: { roomId, algorithm, status: 'WAITING'|'REQUESTED'|'APPROVED'|'REJECTED', requesterName, encryptedContent } }
const p2pRooms = new Map();

// Clean up old rooms (older than 30 mins)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of p2pRooms.entries()) {
    if (now - room.createdAt > 30 * 60 * 1000) {
      p2pRooms.delete(roomId);
    }
  }
}, 5 * 60 * 1000);

// Helper for generating room ID
function generateRoomId() {
  return 'p2p-' + crypto.randomBytes(3).toString('hex');
}

// 1. Host (Sender) creates a Live P2P Handshake Room
router.post('/create-room', (req, res) => {
  const { algorithm, customRoomId } = req.body;

  let roomId = customRoomId && customRoomId.trim() ? customRoomId.trim() : generateRoomId();

  if (p2pRooms.has(roomId)) {
    const existing = p2pRooms.get(roomId);
    if (existing.status !== 'CLOSED') {
      roomId = generateRoomId();
    }
  }

  const newRoom = {
    roomId,
    algorithm: algorithm || 'AES-256',
    status: 'WAITING', // WAITING -> REQUESTED -> APPROVED / REJECTED
    requesterName: null,
    messages: [], // 2-way encrypted chat messages
    createdAt: Date.now()
  };

  p2pRooms.set(roomId, newRoom);

  res.json({
    success: true,
    roomId: roomId,
    status: 'WAITING'
  });
});

// 2. Guest (Receiver) requests access to Sender's P2P room
router.post('/request-access', (req, res) => {
  const { roomId, requesterName } = req.body;

  if (!roomId || !p2pRooms.has(roomId)) {
    return res.status(404).json({ error: 'P2P Handshake Room not found or expired.' });
  }

  const room = p2pRooms.get(roomId);
  room.status = 'REQUESTED';
  room.requesterName = requesterName || 'Receiver Device';
  p2pRooms.set(roomId, room);

  res.json({
    success: true,
    message: 'Handshake request sent to Sender. Waiting for approval...',
    status: room.status
  });
});

// 3. Sender & Receiver check room status & fetch 2-way chat messages
router.get('/room-status/:roomId', (req, res) => {
  const { roomId } = req.params;

  if (!p2pRooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found or closed' });
  }

  const room = p2pRooms.get(roomId);
  res.json({
    success: true,
    roomId: room.roomId,
    status: room.status,
    algorithm: room.algorithm,
    requesterName: room.requesterName,
    messages: room.messages || []
  });
});

// 4. Host (Sender) approves request and delivers initial message
router.post('/approve-request', (req, res) => {
  const { roomId, encryptedContent, approve } = req.body;

  if (!roomId || !p2pRooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const room = p2pRooms.get(roomId);

  if (approve) {
    room.status = 'APPROVED';
    if (encryptedContent) {
      room.messages.push({
        id: crypto.randomBytes(4).toString('hex'),
        sender: 'Sender',
        encryptedContent: encryptedContent,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  } else {
    room.status = 'REJECTED';
  }

  p2pRooms.set(roomId, room);

  res.json({
    success: true,
    status: room.status
  });
});

// 5. Send 2-Way Encrypted Chat Message (Used by both Sender and Receiver)
router.post('/send-chat-msg', (req, res) => {
  const { roomId, senderRole, encryptedContent } = req.body;

  if (!roomId || !p2pRooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const room = p2pRooms.get(roomId);

  if (room.status !== 'APPROVED') {
    return res.status(403).json({ error: 'Room connection not approved' });
  }

  if (!encryptedContent) {
    return res.status(400).json({ error: 'Encrypted content is required' });
  }

  const newMsg = {
    id: crypto.randomBytes(4).toString('hex'),
    sender: senderRole || 'User',
    encryptedContent: encryptedContent,
    timestamp: new Date().toLocaleTimeString()
  };

  room.messages.push(newMsg);
  p2pRooms.set(roomId, room);

  res.json({
    success: true,
    message: newMsg
  });
});

module.exports = router;
