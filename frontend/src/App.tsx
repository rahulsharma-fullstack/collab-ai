import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MessageSquare, Brain, Users, LogIn } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import AIChat from './components/AIChat';
import Integrations from './pages/Integrations';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';
import Gmail from './pages/Gmail';
import GmailCallback from './pages/GmailCallback';

// Components
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="flex h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/gmail/callback" element={<GmailCallback />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="flex w-full h-full">
                      <Sidebar />
                      <div className="flex-1 overflow-hidden">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/chat/:chatId?" element={<Chat />} />
                          <Route path="/ai" element={<AIChat />} />
                          <Route path="/gmail" element={<Gmail />} />
                          <Route path="/integrations" element={<Integrations />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;