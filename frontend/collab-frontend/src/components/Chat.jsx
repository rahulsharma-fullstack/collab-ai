import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Paper,
  Grid,
  Divider,
  Tab,
  Tabs,
  Chip,
  IconButton,
  CircularProgress,
  Badge,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MemoryRecall from './MemoryRecall';

const Chat = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0 for users, 1 for AI, 2 for Memory Recall
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket with retry mechanism
  const initializeSocket = () => {
    if (!token) {
      navigate('/');
      return;
    }

    setReconnecting(true);
    
    // Check server health before connecting socket
    axios.get(`${import.meta.env.VITE_API_URL}/health`)
      .then(() => {
        // Server is up, try to connect socket
        const newSocket = io(import.meta.env.VITE_API_URL, {
          auth: {
            token,
            username: currentUser?.username || 'Anonymous'
          },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling']
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('Socket connected');
          setSocket(newSocket);
          setConnectionError(false);
          setReconnecting(false);
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setErrorMessage(`Connection error: ${err.message}`);
          setConnectionError(true);
          
          if (err.message === 'Authentication error') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setConnectionError(true);
          setErrorMessage(`Disconnected: ${reason}`);
          
          if (reason === 'io server disconnect') {
            // Server disconnected us, try to reconnect
            setTimeout(() => {
              newSocket.connect();
            }, 1000);
          }
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('Socket reconnected after', attemptNumber, 'attempts');
          setConnectionError(false);
          setReconnecting(false);
        });

        newSocket.on('reconnect_error', (err) => {
          console.error('Socket reconnection error:', err);
          setErrorMessage(`Reconnection error: ${err.message}`);
        });

        newSocket.on('reconnect_failed', () => {
          console.error('Socket reconnection failed');
          setErrorMessage('Reconnection failed. Please refresh the page.');
          setReconnecting(false);
        });

      })
      .catch(err => {
        console.error('Server health check failed:', err);
        setErrorMessage('Server is unavailable. Retrying...');
        setConnectionError(true);
        // Retry after 3 seconds
        setTimeout(initializeSocket, 3000);
      });
  };

  useEffect(() => {
    initializeSocket();
    
    // Fetch users
    const fetchUsers = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(response.data.filter(user => user._id !== currentUser.id));
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, navigate]);

  useEffect(() => {
    if (!socket) return;

    socket.on('private message', (msg) => {
      if (
        selectedUser && 
        (msg.sender === selectedUser._id || msg.receiver === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, msg]);
        // Get new suggestions when receiving a message
        if (msg.sender === selectedUser._id) {
          getSuggestions();
        }
      }
    });

    socket.on('ai response', (response) => {
      if (activeTab === 1) {
        setAiMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.message,
          timestamp: response.timestamp
        }]);
      }
    });

    socket.on('typing', (data) => {
      if (selectedUser && data.userId === selectedUser._id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: data.isTyping
        }));
      }
    });

    socket.on('user status', (data) => {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: data.status === 'online'
      }));
    });

    socket.on('online users', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('private message');
      socket.off('ai response');
      socket.off('typing');
      socket.off('user status');
      socket.off('online users');
    };
  }, [socket, selectedUser, activeTab]);

  useEffect(() => {
    if (selectedUser) {
      // Fetch message history with selected user
      const fetchMessages = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/messages/${selectedUser._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setMessages(response.data);
          // Get suggestions after loading messages
          getSuggestions();
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };
      fetchMessages();
    }
  }, [selectedUser, token]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiMessages]);

  const getSuggestions = async () => {
    if (!selectedUser) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/suggest`,
        { receiverId: selectedUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions(response.data);
    } catch (err) {
      console.error('Error getting suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const sendMessage = () => {
    if (input.trim() && selectedUser && socket && socket.connected) {
      socket.emit('private message', {
        text: input,
        receiverId: selectedUser._id
      });
      setInput('');
      // Clear typing indicator
      socket.emit('typing', {
        receiverId: selectedUser._id,
        isTyping: false
      });
    } else if (!socket || !socket.connected) {
      setErrorMessage('Cannot send message: Not connected to server');
      setConnectionError(true);
    }
  };

  const sendAiMessage = () => {
    if (aiInput.trim() && socket && socket.connected) {
      const userMessage = { role: 'user', content: aiInput };
      setAiMessages(prev => [...prev, userMessage]);
      
      socket.emit('ai message', { text: aiInput });
      setAiInput('');
    } else if (!socket || !socket.connected) {
      setErrorMessage('Cannot send message: Not connected to server');
      setConnectionError(true);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Handle typing indicator
    if (selectedUser && socket && socket.connected) {
      // Clear previous timeout
      if (typingTimeout) clearTimeout(typingTimeout);
      
      // Set typing status to true
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          receiverId: selectedUser._id,
          isTyping: true
        });
      }
      
      // Set timeout to clear typing status
      const timeout = setTimeout(() => {
        setIsTyping(false);
        if (socket.connected) {
          socket.emit('typing', {
            receiverId: selectedUser._id,
            isTyping: false
          });
        }
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const useSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  const handleCloseError = () => {
    setConnectionError(false);
  };

  const handleRetryConnection = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    initializeSocket();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Snackbar 
        open={connectionError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={handleCloseError}
          action={
            <Button color="inherit" size="small" onClick={handleRetryConnection}>
              Retry
            </Button>
          }
        >
          {errorMessage || 'Connection error'}
        </Alert>
      </Snackbar>

      {reconnecting && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Alert severity="info" icon={<CircularProgress size={20} />}>
            Connecting to server...
          </Alert>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4">Chat</Typography>
            <Button variant="outlined" color="error" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Chat with Users" />
            <Tab label="Chat with AI" />
            <Tab label="Memory Recall" />
          </Tabs>
        </Grid>
        
        {activeTab === 0 ? (
          <>
            <Grid item xs={12} md={3}>
              <Paper sx={{ height: '70vh', overflow: 'auto' }}>
                <List>
                  {users.map((user) => (
                    <ListItem 
                      button 
                      key={user._id}
                      selected={selectedUser?._id === user._id}
                      onClick={() => setSelectedUser(user)}
                    >
                      <Badge 
                        color={onlineUsers[user._id] ? "success" : "error"} 
                        variant="dot" 
                        sx={{ mr: 1 }}
                      />
                      <ListItemText primary={user.username} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={9}>
              <Paper sx={{ height: '70vh', p: 2, display: 'flex', flexDirection: 'column' }}>
                {selectedUser ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">
                        Chatting with {selectedUser.username}
                      </Typography>
                      <Chip 
                        label={onlineUsers[selectedUser._id] ? "Online" : "Offline"} 
                        color={onlineUsers[selectedUser._id] ? "success" : "default"} 
                        size="small" 
                      />
                    </Box>
                    
                    <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                      {messages.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                          No messages yet. Start the conversation!
                        </Typography>
                      ) : (
                        messages.map((msg, i) => (
                          <Box
                            key={i}
                            sx={{
                              mb: 1,
                              textAlign: msg.sender === currentUser.id ? 'right' : 'left'
                            }}
                          >
                            <Typography
                              sx={{
                                display: 'inline-block',
                                bgcolor: msg.sender === currentUser.id ? 'primary.main' : 'grey.300',
                                color: msg.sender === currentUser.id ? 'white' : 'black',
                                p: 1,
                                borderRadius: 1,
                                maxWidth: '70%'
                              }}
                            >
                              {msg.text}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Typography>
                          </Box>
                        ))
                      )}
                      {typingUsers[selectedUser._id] && (
                        <Box sx={{ textAlign: 'left', mb: 1 }}>
                          <Typography
                            sx={{
                              display: 'inline-block',
                              bgcolor: 'grey.200',
                              p: 1,
                              borderRadius: 1
                            }}
                          >
                            Typing...
                          </Typography>
                        </Box>
                      )}
                      <div ref={messagesEndRef} />
                    </Box>

                    {suggestions.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {suggestions.map((suggestion, i) => (
                          <Chip 
                            key={i} 
                            label={suggestion} 
                            onClick={() => useSuggestion(suggestion)} 
                            color="primary" 
                            variant="outlined"
                            clickable
                          />
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message"
                        variant="outlined"
                        size="small"
                        disabled={!socket || !socket.connected}
                      />
                      <Button 
                        variant="contained" 
                        onClick={sendMessage}
                        disabled={!socket || !socket.connected}
                      >
                        Send
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Typography variant="h6" sx={{ textAlign: 'center', mt: 3 }}>
                    Select a user to start chatting
                  </Typography>
                )}
              </Paper>
            </Grid>
          </>
        ) : activeTab === 1 ? (
          <Grid item xs={12}>
            <Paper sx={{ height: '70vh', p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Chat with AI Assistant
              </Typography>
              
              <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                {aiMessages.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                    Ask me anything!
                  </Typography>
                ) : (
                  aiMessages.map((msg, i) => (
                    <Box
                      key={i}
                      sx={{
                        mb: 1,
                        textAlign: msg.role === 'user' ? 'right' : 'left'
                      }}
                    >
                      <Typography
                        sx={{
                          display: 'inline-block',
                          bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.300',
                          color: msg.role === 'user' ? 'white' : 'black',
                          p: 1,
                          borderRadius: 1,
                          maxWidth: '70%'
                        }}
                      >
                        {msg.content}
                      </Typography>
                    </Box>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()}
                  placeholder="Ask the AI assistant..."
                  variant="outlined"
                  size="small"
                  disabled={!socket || !socket.connected}
                />
                <Button 
                  variant="contained" 
                  onClick={sendAiMessage}
                  disabled={!socket || !socket.connected}
                >
                  Send
                </Button>
              </Box>
            </Paper>
          </Grid>
        ) : (
          <Grid item xs={12}>
            <MemoryRecall />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Chat;