import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, RefreshCw, ExternalLink, X } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  labels: string[];
}

const Gmail: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIntegrated, setIsIntegrated] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    checkIntegration();
  }, []);

  const checkIntegration = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/gmail/emails`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsIntegrated(true);
      setEmails(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIsIntegrated(false);
      } else if (err.response?.data?.needsReauth) {
        setIsIntegrated(false);
        setError('Gmail authentication expired. Please reconnect your account.');
      } else {
        setError('Failed to check Gmail integration');
      }
    }
  };

  const handleIntegrate = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/api/gmail/auth-url`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      window.location.href = response.data.url;
    } catch (err) {
      setError('Failed to start Gmail integration');
    }
  };

  const refreshEmails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/gmail/emails`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmails(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  if (!isIntegrated) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Mail className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Connect Gmail</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Integrate your Gmail account to view and manage your emails directly in the app.
        </p>
        <button
          onClick={handleIntegrate}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Connect Gmail Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Gmail Inbox</h1>
          <button
            onClick={refreshEmails}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className="border-b border-gray-200 hover:bg-gray-50 p-4 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-900">{email.from}</h3>
              <span className="text-xs text-gray-500">
                {new Date(email.date).toLocaleString()}
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-800 mb-1">{email.subject}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{email.snippet}</p>
          </div>
        ))}
      </div>

      {/* Email Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">{selectedEmail.subject}</h2>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>From:</strong> {selectedEmail.from}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>To:</strong> {selectedEmail.to}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}
                </p>
              </div>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gmail;