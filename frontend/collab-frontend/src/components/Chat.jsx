import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(import.meta.env.VITE_API_URL);

const Chat = () => {
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

  return (
    <div>
      <h2>Chat</h2>
      <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {messages.map((msg, i) => (
          <p key={i} style={{ margin: '5px 0' }}>
            <strong>{msg.user}:</strong> {msg.text}
          </p>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            style={{ flex: 1, padding: '8px' }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
        {isLoading ? (
          <div>Loading suggestions...</div>
        ) : (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {suggestions.map((sug, i) => (
              <button 
                key={i} 
                onClick={() => sendSuggestion(sug)}
                style={{ fontSize: '0.9em' }}
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;