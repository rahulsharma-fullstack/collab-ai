require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// Configure CORS properly for both Express and Socket.IO
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow both localhost and 127.0.0.1
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure Socket.IO with proper CORS
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000, // Increase ping timeout
  transports: ['websocket', 'polling'] // Try both transports
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get messages between two users
app.get('/messages/:receiverId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: req.params.receiverId },
        { sender: req.params.receiverId, receiver: req.user.userId }
      ]
    })
    .sort({ timestamp: 1 })
    .limit(100);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Get AI suggestions based on chat history
app.post('/ai/suggest', authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    // Get recent messages between users
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: receiverId },
        { sender: receiverId, receiver: req.user.userId }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10);
    
    // If no messages, return default suggestions
    if (messages.length === 0) {
      return res.json(['Hi there!', 'How are you?', 'Nice to chat with you!']);
    }
    
    // Format messages for AI
    const chatHistory = messages.reverse().map(msg => {
      const isUser = msg.sender.toString() === req.user.userId;
      return `${isUser ? 'You' : 'Friend'}: ${msg.text}`;
    }).join('\n');
    
    // Make API call to Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: `Based on this chat history, suggest 3 short, natural responses I could send next:\n\n${chatHistory}` }
            ]
          }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response');
    }

    const suggestions = response.data.candidates[0].content.parts[0].text
      .split(/\d+\./)
      .filter(text => text.trim().length > 0)
      .map(text => text.trim())
      .slice(0, 3);
    
    res.json(suggestions);
  } catch (err) {
    console.error('AI suggestion error:', err.message);
    res.status(200).json(['How are you?', 'Nice to chat with you!', 'What\'s new?']);
  }
});

// Socket.IO with more robust authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  } catch (err) {
    console.error('Socket auth error:', err);
    next(new Error('Authentication error'));
  }
});

// Track online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  // Add error handling for the socket connection
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Get username from authentication or session
  const username = socket.handshake.auth.username || 'Anonymous';
  
  console.log('User connected:', socket.id, 'Username:', username);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, username);
  });

  // Add user to online users
  onlineUsers.set(socket.userId, socket.id);
  
  // Broadcast online status
  io.emit('user status', {
    userId: socket.userId,
    status: 'online'
  });

  // Join a private room
  socket.join(socket.userId);

  // Send current online users to the newly connected user
  const onlineUsersList = {};
  onlineUsers.forEach((value, key) => {
    onlineUsersList[key] = true;
  });
  socket.emit('online users', onlineUsersList);

  socket.on('private message', async (data) => {
    try {
      const message = new Message({
        text: data.text,
        sender: socket.userId,
        receiver: data.receiverId,
        timestamp: new Date()
      });
      
      await message.save();
      
      // Emit to sender
      io.to(socket.userId).emit('private message', message);
      
      // Emit to receiver if online
      if (onlineUsers.has(data.receiverId)) {
        io.to(data.receiverId).emit('private message', message);
      }
    } catch (err) {
      console.error('Message error:', err);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('typing', (data) => {
    if (onlineUsers.has(data.receiverId)) {
      io.to(data.receiverId).emit('typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    }
  });

  socket.on('ai message', async (data) => {
    try {
      // Simple AI response (replace with actual AI if available)
      const aiResponse = {
        message: `This is a response to: "${data.message}"`
      };
      
      socket.emit('ai response', aiResponse);
    } catch (err) {
      console.error('AI message error:', err);
      socket.emit('error', 'Failed to get AI response');
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));