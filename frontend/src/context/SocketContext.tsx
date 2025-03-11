import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

interface Message {
  _id?: string;
  text: string;
  sender: string;
  senderType: 'user' | 'ai';
  receiver: string;
  receiverType: 'user' | 'ai';
  timestamp: Date;
  isAI?: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  sendMessage: (text: string, receiverId: string) => void;
  sendAIMessage: (text: string) => void;
  messages: Message[];
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket connection
    const newSocket = io(API_URL, {
      auth: {
        token,
        username: user.username
      }
    });

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('private message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('ai response', (response) => {
      const aiMessage: Message = {
        text: response.message,
        sender: 'AI_ASSISTANT',
        senderType: 'ai',
        receiver: user._id,
        receiverType: 'user',
        timestamp: new Date(response.timestamp),
        isAI: true
      };
      setMessages(prev => [...prev, aiMessage]);
    });

    newSocket.on('typing', (data) => {
      if (data.userId !== user._id) {
        setIsTyping(data.isTyping);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const sendMessage = (text: string, receiverId: string) => {
    if (!socket) return;

    const message: Message = {
      text,
      sender: user?._id || '',
      senderType: 'user',
      receiver: receiverId,
      receiverType: 'user',
      timestamp: new Date()
    };

    socket.emit('private message', {
      text,
      receiverId
    });

    setMessages(prev => [...prev, message]);
  };

  const sendAIMessage = (text: string) => {
    if (!socket) return;

    const userMessage: Message = {
      text,
      sender: user?._id || '',
      senderType: 'user',
      receiver: 'AI_ASSISTANT',
      receiverType: 'ai',
      timestamp: new Date()
    };

    socket.emit('ai message', { text });
    setMessages(prev => [...prev, userMessage]);
  };

  return (
    <SocketContext.Provider value={{ socket, sendMessage, sendAIMessage, messages, isTyping, setIsTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 