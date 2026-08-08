const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const messageRoutes = require('./routes/messageRoutes');
const p2pRoutes = require('./experiments/p2pRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/encripmsg';

let isDbConnected = false;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection middleware flag
app.use((req, res, next) => {
  req.isDbConnected = isDbConnected;
  next();
});

// Routes
app.use('/api/messages', messageRoutes);
app.use('/api/p2p', p2pRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    dbConnected: isDbConnected,
    mode: isDbConnected ? 'MongoDB Database' : 'In-Memory Fallback Store'
  });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    isDbConnected = true;
  })
  .catch((err) => {
    console.log('MongoDB connection warning:', err.message);
    console.log('App will continue running using in-memory store mode for instant demo testing.');
    isDbConnected = false;
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
