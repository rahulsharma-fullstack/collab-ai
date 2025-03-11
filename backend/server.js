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
const Memory = require('./models/Memory');
const { analyzeMessage } = require('./utils/memoryDetection');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend requests
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true
}));

app.use(express.json());

// Configure Socket.IO with proper CORS
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Vite's default port
    credentials: true
  },
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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/gmail', require('./routes/gmail'));

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
      
      // Analyze message for memory creation
      const analysis = analyzeMessage(data.text);
      if (analysis.isImportant) {
        const memory = new Memory({
          type: analysis.type,
          content: data.text,
          originalMessage: message._id,
          participants: [socket.userId, data.receiverId],
          extractedDate: analysis.extractedDate,
          createdBy: socket.userId
        });
        await memory.save();
      }
      
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
    console.log('Received AI message request:', data.text);
    
    try {
      if (!socket.userId) {
        throw new Error('User not authenticated');
      }

      // Save user message
      const userMessage = new Message({
        text: data.text,
        sender: socket.userId,
        senderType: 'user',
        receiver: 'AI_ASSISTANT',
        receiverType: 'ai',
        timestamp: new Date(),
        isAI: false
      });
      await userMessage.save();

      // Get all user's chats from the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentMessages = await Message.find({
        $or: [
          { sender: socket.userId },
          { receiver: socket.userId }
        ],
        timestamp: { $gte: oneDayAgo }
      })
      .sort('timestamp');

      // Format chat history for better context
      const chatHistory = recentMessages.map(msg => {
        const senderName = msg.sender === socket.userId ? 'You' : 
                          msg.sender === 'AI_ASSISTANT' ? 'AI' : 
                          'Other';
        const time = new Date(msg.timestamp).toLocaleTimeString();
        return `[${time}] ${senderName}: ${msg.text}`;
      }).join('\n');

      // Get any scheduled meetings or important events
      const meetings = await Memory.find({
        participants: socket.userId,
        type: 'meeting',
        extractedDate: { $exists: true }
      }).sort('extractedDate');

      const meetingsContext = meetings.map(m => 
        `Meeting: ${m.content} (${m.extractedDate})`
      ).join('\n');

      // Prepare a more focused prompt based on the user's question
      let contextPrompt = '';
      const question = data.text.toLowerCase();

      if (question.includes('meeting') || question.includes('schedule')) {
        contextPrompt = `
Here are your recent meetings and schedules:
${meetingsContext || 'No scheduled meetings found.'}

Recent chat context:
${chatHistory}

Please help with this question about meetings/schedules: ${data.text}
Focus on providing specific meeting times, participants, and any related details from the chat history.`;
      } else {
        contextPrompt = `
Recent chat history:
${chatHistory}

Please help with this request: ${data.text}
If it's about past conversations, I'll summarize the relevant parts.
If it's about meetings or events, I'll check the schedule and provide details.
Keep the response natural and conversational.`;
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: contextPrompt
            }]
          }]
        }
      );

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

      // Save AI response message
      const aiMessage = new Message({
        text: aiResponse,
        sender: 'AI_ASSISTANT',
        senderType: 'ai',
        receiver: socket.userId,
        receiverType: 'user',
        timestamp: new Date(),
        isAI: true
      });
      await aiMessage.save();

      // Check if AI's response contains any important information
      const analysis = analyzeMessage(aiResponse);
      if (analysis.isImportant) {
        const memory = new Memory({
          type: analysis.type,
          content: aiResponse,
          originalMessage: aiMessage._id,
          participants: [socket.userId],
          extractedDate: analysis.extractedDate,
          createdBy: 'AI_ASSISTANT',
          creatorType: 'ai'
        });
        await memory.save();
      }

      socket.emit('ai response', {
        message: aiResponse,
        timestamp: new Date(),
        isAI: true
      });

    } catch (err) {
      console.error('AI message error:', err);
      socket.emit('error', 'Failed to process AI message');
    }
  });
});

// Add new endpoint for memory recall
app.get('/memories', authenticateToken, async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    const query = {
      participants: req.user.userId,
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };
    
    if (type) {
      query.type = type;
    }

    const memories = await Memory.find(query)
      .populate('originalMessage')
      .populate('participants', 'username')
      .sort('-createdAt')
      .limit(20);

    // Use Gemini to summarize memories
    const memoryTexts = memories.map(m => m.content).join('\n');
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Summarize these important points from chat messages. Focus on dates, decisions, and key information:\n\n${memoryTexts}`
          }]
        }]
      }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary available';

    res.json({
      memories,
      summary
    });
  } catch (err) {
    console.error('Error fetching memories:', err);
    res.status(500).json({ error: 'Error fetching memories' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));