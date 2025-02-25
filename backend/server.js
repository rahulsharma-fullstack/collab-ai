require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } }); // Vite runs on 5173

app.use(cors({ origin: 'http://localhost:5173' })); // Allow Vite frontend
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/ai', require('./routes/ai'));

// Make sure this route is defined before socket.io setup
app.get('/messages', async (req, res) => {
  const Message = require('./models/Message');
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send('Error fetching messages');
  }
});

// Socket.IO for real-time messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('message', async (msg) => {
    const Message = require('./models/Message');
    const message = new Message({ text: msg.text, user: msg.user });
    await message.save();
    io.emit('message', message); // Broadcast to all clients
  });
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));