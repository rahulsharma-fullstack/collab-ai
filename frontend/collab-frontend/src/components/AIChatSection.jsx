import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import { Send as SendIcon, Memory as MemoryIcon } from '@mui/icons-material';

const AIChatSection = ({ socket }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (!socket) {
      console.log('Socket not initialized');
      return;
    }

    socket.on('ai response', (data) => {
      console.log('Received AI response:', data);
      setIsLoading(false);
      setChatHistory(prev => [...prev, {
        text: data.message,
        sender: 'ai',
        timestamp: data.timestamp
      }]);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setIsLoading(false);
      setChatHistory(prev => [...prev, {
        text: 'Sorry, there was an error processing your request.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    });

    return () => {
      socket.off('ai response');
      socket.off('error');
    };
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    console.log('Sending message to AI:', message);
    
    setChatHistory(prev => [...prev, {
      text: message,
      sender: 'user',
      timestamp: new Date()
    }]);

    setIsLoading(true);
    socket.emit('ai message', { text: message });
    setMessage('');
  };

  const suggestedQueries = [
    "What meetings do I have coming up?",
    "Summarize recent decisions",
    "What were the key points from our last discussion?",
    "Any upcoming deadlines I should know about?"
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {suggestedQueries.map((query, index) => (
          <Chip
            key={index}
            label={query}
            onClick={() => {
              setMessage(query);
              // Optional: automatically submit the query
              socket.emit('ai message', { text: query });
              setChatHistory(prev => [...prev, {
                text: query,
                sender: 'user',
                timestamp: new Date()
              }]);
              setIsLoading(true);
            }}
            icon={<MemoryIcon />}
            variant="outlined"
            clickable
          />
        ))}
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        {chatHistory.map((chat, index) => (
          <Paper
            key={index}
            sx={{
              p: 2,
              mb: 1,
              bgcolor: chat.sender === 'ai' ? 'primary.light' : 'grey.100',
              color: chat.sender === 'ai' ? 'primary.contrastText' : 'text.primary',
              maxWidth: '80%',
              ml: chat.sender === 'ai' ? 0 : 'auto',
              mr: chat.sender === 'ai' ? 'auto' : 0,
            }}
          >
            <Typography variant="body1">{chat.text}</Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
              {new Date(chat.timestamp).toLocaleString()}
            </Typography>
          </Paper>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 'auto' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask me anything about your chats and meetings..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <Button
                type="submit"
                disabled={isLoading || !message.trim()}
                sx={{ ml: 1 }}
              >
                <SendIcon />
              </Button>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default AIChatSection; 