import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(import.meta.env.VITE_API_URL);

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off('message');
  }, []);

  const fetchSuggestions = async (msg) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/smart-reply`, { message: msg });
      setSuggestions(res.data);
    } catch (err) {
      console.error('Error fetching suggestions', err);
    }
  };

  useEffect(() => {
    if (input) fetchSuggestions(input);
  }, [input]);

  const sendMessage = () => {
    if (input) {
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

  return (
    <div>
      <h2>Chat</h2>
      <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc' }}>
        {messages.map((msg, i) => (
          <p key={i}>
            <strong>{msg.user}:</strong> {msg.text}
          </p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
      <div>
        {suggestions.map((sug, i) => (
          <button key={i} onClick={() => sendSuggestion(sug)}>{sug}</button>
        ))}
      </div>
    </div>
  );
};

export default Chat;