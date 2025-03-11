import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Plus, Brain, Paperclip, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

interface Message {
  _id: string;
  sender: string;
  content: string;
  timestamp: string;
  isAI: boolean;
}

interface Chat {
  _id: string;
  title: string;
  createdAt: string;
}

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    // This would normally be fetched from the API
    const mockChats: Chat[] = [
      { _id: '1', title: 'Project Kickoff Discussion', createdAt: '2025-02-20T10:00:00Z' },
      { _id: '2', title: 'Marketing Strategy', createdAt: '2025-02-18T14:30:00Z' },
      { _id: '3', title: 'Q1 Budget Planning', createdAt: '2025-02-15T09:15:00Z' },
    ];
    
    setChats(mockChats);
    
    if (chatId) {
      const chat = mockChats.find(c => c._id === chatId);
      if (chat) setCurrentChat(chat);
      
      // Mock messages for the selected chat
      const mockMessages: Message[] = [
        {
          _id: '101',
          sender: 'John Doe',
          content: 'Hey team, I wanted to discuss our approach for the new feature.',
          timestamp: '2025-02-20T10:05:00Z',
          isAI: false
        },
        {
          _id: '102',
          sender: 'Memento AI',
          content: 'Based on your previous discussions, I recall that you wanted to prioritize user experience over adding new features. Would you like me to summarize the key points from those conversations?',
          timestamp: '2025-02-20T10:06:00Z',
          isAI: true
        },
        {
          _id: '103',
          sender: 'Sarah Johnson',
          content: 'Yes, that would be helpful. Also, can we review the timeline for this sprint?',
          timestamp: '2025-02-20T10:08:00Z',
          isAI: false
        },
        {
          _id: '104',
          sender: 'Memento AI',
          content: 'From your planning meeting on February 10th, the team agreed on a 2-week sprint ending on March 5th. The main deliverables were: 1) UI redesign for the dashboard, 2) API integration with the payment gateway, and 3) Performance optimization for mobile devices.',
          timestamp: '2025-02-20T10:09:00Z',
          isAI: true
        }
      ];
      
      setMessages(mockMessages);
    } else if (mockChats.length > 0) {
      // If no chat is selected, default to the first one
      setCurrentChat(mockChats[0]);
      
      // Mock messages for the default chat
      const defaultMessages: Message[] = [
        {
          _id: '201',
          sender: 'Alex Chen',
          content: 'Let\'s start planning the project kickoff meeting.',
          timestamp: '2025-02-20T10:00:00Z',
          isAI: false
        },
        {
          _id: '202',
          sender: 'Memento AI',
          content: 'I suggest including the following agenda items based on your previous successful kickoffs: 1) Project overview, 2) Team introductions, 3) Timeline review, 4) Q&A session.',
          timestamp: '2025-02-20T10:01:00Z',
          isAI: true
        }
      ];
      
      setMessages(defaultMessages);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message
    const newUserMessage: Message = {
      _id: Date.now().toString(),
      sender: user?.name || 'User',
      content: message,
      timestamp: new Date().toISOString(),
      isAI: false
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setMessage('');
    setLoading(true);
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse: Message = {
        _id: (Date.now() + 1).toString(),
        sender: 'Memento AI',
        content: `I've analyzed your message and previous conversations. Based on our chat history, I think we should consider the following points related to "${message}"...`,
        timestamp: new Date().toISOString(),
        isAI: true
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 1500);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full">
      {/* Chat list sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </button>
        </div>
        
        <div className="py-2">
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Conversations</h3>
          <div className="mt-2">
            {chats.map(chat => (
              <a
                key={chat._id}
                href={`/chat/${chat._id}`}
                className={`block px-4 py-2 text-sm ${
                  currentChat?._id === chat._id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium truncate">{chat.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(chat.createdAt).toLocaleDateString()}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{currentChat?.title || 'New Conversation'}</h2>
            <p className="text-sm text-gray-500">
              {messages.length} messages
            </p>
          </div>
          <div className="flex items-center">
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <Brain className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-6">
            {messages.map(msg => (
              <div
                key={msg._id}
                className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-3/4 rounded-lg px-4 py-2 shadow ${
                  msg.isAI ? 'bg-white' : 'bg-indigo-600 text-white'
                }`}>
                  <div className="flex items-center">
                    <span className="font-medium text-sm">
                      {msg.sender}
                    </span>
                    <span className="ml-2 text-xs opacity-75">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-3/4 rounded-lg px-4 py-2 shadow bg-white">
                  <div className="flex items-center">
                    <span className="font-medium text-sm">Memento AI</span>
                  </div>
                  <div className="mt-1 flex items-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Message input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex items-center">
            <button
              type="button"
              className="p-2 rounded-full text-gray-400 hover:text-gray-600"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 mx-4 py-2 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className={`p-2 rounded-full ${
                message.trim() && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;