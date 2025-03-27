import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

const AIChat = () => {
  const [message, setMessage] = useState('');
  const [emailMode, setEmailMode] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, sendAIMessage, isTyping, setMessages } = useSocket();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (emailMode) {
      try {
        const userMessage = {
          text: message,
          sender: user?._id || '',
          senderType: 'user',
          receiver: 'AI_ASSISTANT',
          receiverType: 'email',
          timestamp: new Date(),
          isAI: false
        };

        setMessages(prev => [...prev, userMessage]);
        setMessage('');

        const response = await axios.post(
          `${API_URL}/api/email-query`,
          { question: message },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        const aiMessage = {
          text: response.data.answer,
          sender: 'AI_ASSISTANT',
          senderType: 'ai',
          receiver: user?._id || '',
          receiverType: 'email',
          timestamp: new Date(),
          isAI: true
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Email query error:', error);
        // Show error message to user
        const errorMessage = {
          text: "Sorry, I couldn't process your email query. Please try again.",
          sender: 'AI_ASSISTANT',
          senderType: 'ai',
          receiver: user?._id || '',
          receiverType: 'email',
          timestamp: new Date(),
          isAI: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      sendAIMessage(message);
      setMessage('');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Brain className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={() => setEmailMode(!emailMode)}
          className={`px-3 py-1 rounded-lg ${emailMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          {emailMode ? 'Email Mode' : 'Chat Mode'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages
          .filter(m => 
            m.receiver === 'AI_ASSISTANT' || 
            m.sender === 'AI_ASSISTANT' || 
            m.receiverType === 'email' || 
            m.senderType === 'email'
          )
          .map((msg, index) => (
            <div
              key={msg._id || index}
              className={`flex ${msg.sender === user?._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender === user?._id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === user?._id ? 'text-indigo-100' : 'text-gray-500'
                }`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
        {isTyping && !emailMode && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={emailMode ? 'Ask about your emails...' : 'Ask me anything...'}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;