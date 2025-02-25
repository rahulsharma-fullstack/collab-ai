import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Button, TextField, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const socket = io(import.meta.env.VITE_API_URL);

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off('message');
  }, []);

  const fetchSuggestions = async (msg) => {
    try {
      setIsLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/smart-reply`, { 
        message: msg 
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions(['Reply...']);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the API calls to prevent too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim()) {
        fetchSuggestions(input);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/messages`);
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };
    
    loadMessages();
    
    // Socket event listener
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]));
    
    return () => socket.off('message');
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('message', { text: input, user: 'me' });
      setInput('');
      setSuggestions([]);
    }
  };

  const sendSuggestion = (suggestion) => {
    socket.emit('message', { text: suggestion, user: 'me' });
    setInput('');
    setSuggestions([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Chat</Typography>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
      <Box sx={{ 
        height: '300px', 
        overflowY: 'auto', 
        border: '1px solid #ccc', 
        padding: 1,
        mb: 2,
        borderRadius: 1
      }}>
        {messages.map((msg, i) => (
          <Typography key={i} sx={{ mb: 1 }}>
            <strong>{msg.user}:</strong> {msg.text}
          </Typography>
        ))}
      </Box>
      <TextField
        fullWidth
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message"
        variant="outlined"
        size="small"
        sx={{ mb: 1 }}
      />
      <Button 
        variant="contained" 
        onClick={sendMessage} 
        sx={{ mb: 2 }}
      >
        Send
      </Button>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {isLoading ? (
          <Typography color="text.secondary">Loading suggestions...</Typography>
        ) : (
          suggestions.map((sug, i) => (
            <Button 
              key={i} 
              variant="outlined" 
              onClick={() => sendSuggestion(sug)}
              size="small"
            >
              {sug}
            </Button>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Chat;