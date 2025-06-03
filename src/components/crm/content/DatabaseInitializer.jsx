import React, { useState } from 'react';
import { Database, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { initializeDatabase, resetDatabase } from '../../../utils/initializeDatabase';

const DatabaseInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error' | 'info'

  const handleInitialize = async () => {
    setIsInitializing(true);
    setMessage('');
    
    try {
      await initializeDatabase();
      setMessage('Database initialized successfully! All default options and sample students have been added.');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error initializing database: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('⚠️ This will delete ALL existing data and reinitialize with default data. Are you sure?')) {
      return;
    }
    
    setIsResetting(true);
    setMessage('');
    
    try {
      await resetDatabase();
      setMessage('Database reset successfully! All data has been cleared and reinitialized.');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error resetting database: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsResetting(false);
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getMessageStyle = () => {
    switch (messageType) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Database Management</h2>
              <p className="text-sm text-gray-500">Initialize or reset your student management database</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Initialize Database */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Initialize Database</h3>
            <p className="text-sm text-gray-600">
              This will add default options for funnel steps, course interests, platforms, countries, and cities. 
              It will also add 5 sample students to get you started. Existing data will not be affected.
            </p>
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Initialize Database
                </>
              )}
            </button>
          </div>

          {/* Reset Database */}
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Reset Database</h3>
            <p className="text-sm text-gray-600">
              ⚠️ <strong>Danger Zone:</strong> This will completely clear all existing data (students, options, etc.) 
              and reinitialize with fresh default data. This action cannot be undone.
            </p>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Reset Database
                </>
              )}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg border ${getMessageStyle()}`}>
              <div className="flex items-start space-x-3">
                {getMessageIcon()}
                <div className="flex-1">
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">What gets initialized:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Funnel Steps:</strong> Lead, Contacted, Interested, Paid, Enrolled</li>
              <li>• <strong>Course Interests:</strong> A1.1-C1.1 levels (Online/Offline)</li>
              <li>• <strong>Platforms:</strong> Facebook, Instagram, WhatsApp, Zalo, Website, etc.</li>
              <li>• <strong>Countries:</strong> Vietnam, Germany, US, Canada, Australia, etc.</li>
              <li>• <strong>Cities:</strong> Major cities from supported countries</li>
              <li>• <strong>Sample Students:</strong> 5 example student profiles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseInitializer; 