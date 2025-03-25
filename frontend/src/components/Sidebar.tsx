import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Brain, Settings, Users, LogOut, PlusCircle, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800">Memento</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          <Link
            to="/"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Brain className="mr-3 h-5 w-5" />
            Dashboard
          </Link>

          <Link
            to="/chat"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location.pathname.startsWith('/chat') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="mr-3 h-5 w-5" />
            Messages
          </Link>

          <Link
            to="/ai"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/ai') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Brain className="mr-3 h-5 w-5" />
            AI Assistant
          </Link>

          <Link
            to="/gmail"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/gmail') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Mail className="mr-3 h-5 w-5" />
            Gmail
          </Link>

          <Link
            to="/integrations"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/integrations') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="mr-3 h-5 w-5" />
            Integrations
          </Link>

          <Link
            to="/settings"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/settings') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </nav>

        <div className="px-4 mt-6">
          <button
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Chat
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
            <button
              onClick={logout}
              className="flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <LogOut className="mr-1 h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;