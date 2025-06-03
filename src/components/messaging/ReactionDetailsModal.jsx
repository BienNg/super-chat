import React from 'react';
import { X } from 'lucide-react';

const ReactionDetailsModal = ({ 
  isOpen, 
  onClose, 
  messageId, 
  reactions = [], 
  className = '' 
}) => {
  if (!isOpen) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const { emoji, user, timestamp } = reaction;
    if (!acc[emoji]) {
      acc[emoji] = {
        emoji,
        users: []
      };
    }
    acc[emoji].users.push({
      ...user,
      timestamp
    });
    return acc;
  }, {});

  const reactionGroups = Object.values(groupedReactions);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reactions</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-80">
          {reactionGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl mb-2 block">😶</span>
              <p>No reactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reactionGroups.map(({ emoji, users }) => (
                <div key={emoji} className="space-y-2">
                  {/* Emoji Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm font-medium text-gray-600">
                      {users.length} {users.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>

                  {/* Users List */}
                  <div className="space-y-2">
                    {users.map((user, index) => (
                      <div 
                        key={`${user.id}-${index}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          {/* User Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                            style={{ backgroundColor: user.color || '#6B7280' }}
                          >
                            {user.avatar || user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          
                          {/* User Name */}
                          <span className="font-medium text-gray-900">
                            {user.name}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(user.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReactionDetailsModal; 