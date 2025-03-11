import React, { useState } from 'react';
import { ExternalLink, Check, X, AlertCircle } from 'lucide-react';
import { INTEGRATIONS } from '../config';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  status?: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'slack',
      name: 'Slack',
      description: 'Connect your Slack workspace to sync messages and channels.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/slack.svg',
      connected: true,
      status: 'connected',
      lastSync: '2025-02-25T14:30:00Z'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Integrate with Gmail to manage and respond to emails.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/gmail.svg',
      connected: false
    },
    {
      id: 'outlook',
      name: 'Outlook',
      description: 'Connect Microsoft Outlook for email and calendar integration.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/microsoftoutlook.svg',
      connected: false
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Integrate with Zoom for meeting summaries and action items.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/zoom.svg',
      connected: true,
      status: 'error',
      lastSync: '2025-02-20T09:15:00Z'
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Connect Notion to sync documents and knowledge bases.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/notion.svg',
      connected: false
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Integrate WhatsApp for business messaging and customer support.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/whatsapp.svg',
      connected: true,
      status: 'connected',
      lastSync: '2025-02-24T18:45:00Z'
    }
  ]);

  const handleToggleConnection = (id: string) => {
    setIntegrations(prevIntegrations => 
      prevIntegrations.map(integration => 
        integration.id === id 
          ? { 
              ...integration, 
              connected: !integration.connected,
              status: !integration.connected ? 'connected' : 'disconnected',
              lastSync: !integration.connected ? new Date().toISOString() : undefined
            } 
          : integration
      )
    );
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect Memento with your favorite tools and services
          </p>
        </header>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Available Integrations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enhance your Memento experience by connecting these services
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {integrations.map(integration => (
              <div key={integration.id} className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <img 
                        src={integration.icon} 
                        alt={integration.name} 
                        className="h-6 w-6"
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{integration.name}</h4>
                      <p className="text-sm text-gray-500">{integration.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {integration.connected && (
                      <div className="mr-6 text-right">
                        <div className="flex items-center">
                          {integration.status === 'connected' && (
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                          )}
                          {integration.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            integration.status === 'connected' ? 'text-green-700' : 
                            integration.status === 'error' ? 'text-red-700' : 'text-gray-700'
                          }`}>
                            {integration.status === 'connected' ? 'Connected' : 
                             integration.status === 'error' ? 'Connection Error' : 'Disconnected'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last sync: {formatLastSync(integration.lastSync)}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleToggleConnection(integration.id)}
                      className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        integration.connected
                          ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          : 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {integration.connected ? 'Disconnect' : 'Connect'}
                      {!integration.connected && <ExternalLink className="ml-2 h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Integration Settings</h3>
          </div>
          
          <div className="px-6 py-5">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Data Synchronization</h4>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      defaultChecked
                    />
                    <span className="ml-2 text-sm text-gray-700">Automatically sync data every hour</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900">Message History</h4>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="history"
                      value="all"
                      className="border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      defaultChecked
                    />
                    <span className="ml-2 text-sm text-gray-700">Import all message history</span>
                  </label>
                </div>
                <div className="mt-1">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="history"
                      value="30days"
                      className="border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Import last 30 days only</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900">Privacy</h4>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      defaultChecked
                    />
                    <span className="ml-2 text-sm text-gray-700">Exclude private conversations from AI analysis</span>
                  </label>
                </div>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reset to Defaults
                  </button>
                  <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;