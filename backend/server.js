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
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { createRetrievalChain } = require('langchain/chains/retrieval');
const { OllamaLLM } = require('./utils/ollama');
const { processUserEmails } = require('./utils/emailProcessor');

const app = express();
const server = http.createServer(app);

// Make vectorStores accessible across modules
app.locals.vectorStores = new Map();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  },
  pingTimeout: 60000,
  transports: ['websocket', 'polling']
});

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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/gmail', require('./routes/gmail'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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

app.post('/ai/suggest', authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: receiverId },
        { sender: receiverId, receiver: req.user.userId }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10);
    
    if (messages.length === 0) {
      return res.json(['Hi there!', 'How are you?', 'Nice to chat with you!']);
    }
    
    const chatHistory = messages.reverse().map(msg => {
      const isUser = msg.sender.toString() === req.user.userId;
      return `${isUser ? 'You' : 'Friend'}: ${msg.text}`;
    }).join('\n');
    
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

// Initialize Ollama LLM
const llm = new OllamaLLM({});

app.post('/api/email-query', authenticateToken, async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question required' });

  try {
    let vectorStore = app.locals.vectorStores.get(req.user.userId);
    if (!vectorStore) {
      await processUserEmails(req.user.userId, app.locals.vectorStores);
      vectorStore = app.locals.vectorStores.get(req.user.userId);
      if (!vectorStore) return res.status(404).json({ 
        error: 'No emails processed yet',
        details: 'Please connect your email account first'
      });
    }

    const retriever = vectorStore.asRetriever({
      k: 3,
      searchType: 'similarity'
    });

    const relevantDocs = await retriever.getRelevantDocuments(question);
    console.log('Retrieved documents:', relevantDocs.map(doc => doc.pageContent));

    if (!relevantDocs || relevantDocs.length === 0) {
      return res.json({ 
        answer: "I couldn't find any relevant emails to answer your question.",
        context: 'No relevant emails found'
      });
    }

    const contextText = relevantDocs.map(doc => doc.pageContent).join('\n\n');

    const response = await llm.invoke(
      `Based on these email excerpts:\n${contextText}\n\nQuestion: ${question}\n\nAnswer: `
    );

    res.json({ 
      answer: response,
      context: 'Based on your emails'
    });
  } catch (error) {
    console.error('Email query error:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process email query',
      details: error.message 
    });
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
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

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  const username = socket.handshake.auth.username || 'Anonymous';
  console.log('User connected:', socket.id, 'Username:', username);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, username);
    onlineUsers.delete(socket.userId);
    io.emit('user status', { userId: socket.userId, status: 'offline' });
  });

  onlineUsers.set(socket.userId, socket.id);
  io.emit('user status', { userId: socket.userId, status: 'online' });

  const onlineUsersList = {};
  onlineUsers.forEach((value, key) => {
    onlineUsersList[key] = true;
  });
  socket.emit('online users', onlineUsersList);

  socket.join(socket.userId);

  processUserEmails(socket.userId, app.locals.vectorStores);

  socket.on('private message', async (data) => {
    try {
      const message = new Message({
        text: data.text,
        sender: socket.userId,
        receiver: data.receiverId,
        timestamp: new Date()
      });
      
      await message.save();
      
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
      
      io.to(socket.userId).emit('private message', message);
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
      if (!socket.userId) throw new Error('User not authenticated');

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

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentMessages = await Message.find({
        $or: [
          { sender: socket.userId },
          { receiver: socket.userId }
        ],
        timestamp: { $gte: oneDayAgo }
      }).sort('timestamp');

      const chatHistory = recentMessages.map(msg => {
        const senderName = msg.sender === socket.userId ? 'You' : 
                          msg.sender === 'AI_ASSISTANT' ? 'AI' : 'Other';
        const time = new Date(msg.timestamp).toLocaleTimeString();
        return `[${time}] ${senderName}: ${msg.text}`;
      }).join('\n');

      const meetings = await Memory.find({
        participants: socket.userId,
        type: 'meeting',
        extractedDate: { $exists: true }
      }).sort('extractedDate');

      const meetingsContext = meetings.map(m => 
        `Meeting: ${m.content} (${m.extractedDate})`
      ).join('\n');

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

      const analysis = analyzeMessage(aiResponse);
      if (analysis.isImportant) {
        const memoryData = {
          type: analysis.type,
          content: aiResponse,
          originalMessage: aiMessage._id,
          participants: [socket.userId],
          createdBy: 'AI_ASSISTANT',
          creatorType: 'ai'
        };
        
        // Only add extractedDate if it's valid
        if (analysis.extractedDate) {
          memoryData.extractedDate = analysis.extractedDate;
        }
        
        try {
          const memory = new Memory(memoryData);
          await memory.save();
        } catch (memoryErr) {
          console.error('Memory creation error:', memoryErr);
          // Continue execution even if memory creation fails
        }
      }

      socket.emit('ai response', {
        message: aiMessage,
        timestamp: new Date(),
        isAI: true
      });
    } catch (err) {
      console.error('AI message error:', err);
      socket.emit('error', 'Failed to process AI message');
    }
  });
});

app.get('/memories', authenticateToken, async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    const query = {
      participants: req.user.userId,
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };
    
    if (type) query.type = type;

    const memories = await Memory.find(query)
      .populate('originalMessage')
      .populate('participants', 'username')
      .sort('-createdAt')
      .limit(20);

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

    res.json({ memories, summary });
  } catch (err) {
    console.error('Error fetching memories:', err);
    res.status(500).json({ error: 'Error fetching memories' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));