// src/components/RealTimeUpdates.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Check, CheckCheck, Eye } from 'lucide-react';

const RealTimeUpdates = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: { name: 'Sarah Johnson', avatar: 'SJ', color: 'bg-blue-500' },
      content: 'Good morning everyone!',
      timestamp: '10:23 AM',
      status: 'read',
      readBy: ['Alex Chen', 'Mai Tran']
    }
  ]);
  
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([
    { name: 'Sarah Johnson', status: 'online' },
    { name: 'Alex Chen', status: 'online' },
    { name: 'Mai Tran', status: 'away' },
    { name: 'John Doe', status: 'offline' }
  ]);
  
  const messagesEndRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Simulate real-time message arrival
  useEffect(() => {
    const interval = setInterval(() => {
      const newMessage = {
        id: Date.now(),
        user: { 
          name: 'Alex Chen', 
          avatar: 'AC', 
          color: 'bg-green-500' 
        },
        content: 'This is a new message arriving in real-time!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        isNew: true
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Remove the new indicator after animation
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, isNew: false } : msg
        ));
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Simulate typing indicators
  useEffect(() => {
    const typingInterval = setInterval(() => {
      const users = ['Mai Tran', 'John Doe'];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      setTypingUsers([randomUser]);
      
      setTimeout(() => setTypingUsers([]), 3000);
    }, 8000);

    return () => clearInterval(typingInterval);
  }, []);

  // Auto-scroll management
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop === clientHeight;
    setShouldAutoScroll(isAtBottom);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-indigo-600" />;
      default:
        return null;
    }
  };

  const getOnlineStatus = (status) => {
    const colors = {
      online: 'bg-green-500',
      away: 'bg-yellow-500',
      offline: 'bg-gray-400'
    };
    return colors[status] || 'bg-gray-400';
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Online Users Bar */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Online:</span>
          <div className="flex items-center space-x-3">
            {onlineUsers.filter(user => user.status === 'online').map(user => (
              <div key={user.name} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${getOnlineStatus(user.status)}`}></div>
                <span className="text-sm text-gray-600">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`flex items-start transition-all duration-300 ${
              message.isNew ? 'animate-slide-in-right' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full ${message.user.color} flex-shrink-0 flex items-center justify-center text-white font-medium`}>
              {message.user.avatar}
            </div>
            
            <div className="ml-3 flex-grow">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{message.user.name}</span>
                <span className="text-xs text-gray-500">{message.timestamp}</span>
                {getStatusIcon(message.status)}
              </div>
              
              <div className="mt-1 text-gray-800">
                {message.content}
              </div>

              {/* Read receipts */}
              {message.readBy && message.readBy.length > 0 && (
                <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
                  <Eye className="h-3 w-3" />
                  <span>Read by {message.readBy.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom indicator */}
      {!shouldAutoScroll && (
        <div className="absolute bottom-20 right-4">
          <button
            onClick={() => {
              setShouldAutoScroll(true);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-indigo-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <span className="text-sm">New messages</span>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RealTimeUpdates;