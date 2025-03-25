import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Brain, Users, Zap, Clock, BarChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of your Memento workspace
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Conversations</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">12</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/chat" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Memory Insights</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">243</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Explore insights
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Connected Platforms</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">3</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/integrations" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Manage integrations
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
          </div>
          <div className="px-6 py-5">
            <ul className="divide-y divide-gray-200">
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Q3 Budget Discussion
                    </p>
                    <p className="text-sm text-gray-500">
                      AI summarized 3 conversations about Q3 marketing budget
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      2h ago
                    </span>
                  </div>
                </div>
              </li>
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Zap className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      New Slack Integration
                    </p>
                    <p className="text-sm text-gray-500">
                      Connected Slack workspace "Development Team"
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Yesterday
                    </span>
                  </div>
                </div>
              </li>
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <BarChart className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Knowledge Graph Updated
                    </p>
                    <p className="text-sm text-gray-500">
                      Added 27 new connections to your team's knowledge graph
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      3d ago
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div> */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Memory Highlights</h3>
            </div>
            <div className="px-6 py-5">
              <ul className="divide-y divide-gray-200">
                <li className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <Brain className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">Project Roadmap</p>
                      <p className="mt-1 text-sm text-gray-500">
                        "The team agreed to prioritize the API integration for Q2, followed by the mobile app redesign in Q3."
                      </p>
                      <div className="mt-2 text-xs text-gray-500">From meeting on Feb 12, 2025</div>
                    </div>
                  </div>
                </li>
                <li className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <Brain className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">Client Requirements</p>
                      <p className="mt-1 text-sm text-gray-500">
                        "Acme Corp needs SSO implementation and custom reporting by end of March."
                      </p>
                      <div className="mt-2 text-xs text-gray-500">From Slack conversation on Jan 28, 2025</div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Smart Suggestions</h3>
            </div>
            <div className="px-6 py-5">
              <ul className="divide-y divide-gray-200">
                <li className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <Zap className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">Schedule Follow-up</p>
                      <p className="mt-1 text-sm text-gray-500">
                        You mentioned following up with Sarah about the design mockups this week.
                      </p>
                      <button className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Schedule now
                      </button>
                    </div>
                  </div>
                </li>
                <li className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <Zap className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">Prepare for Meeting</p>
                      <p className="mt-1 text-sm text-gray-500">
                        You have a budget review meeting tomorrow. I can prepare a summary of previous discussions.
                      </p>
                      <button className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Generate summary
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;