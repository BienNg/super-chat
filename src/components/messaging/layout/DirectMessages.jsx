import React, { useState, useEffect } from 'react';
import { User, Plus, Search } from 'lucide-react';
import { useUsers } from '../../../hooks/useUsers';
import { useDirectMessages } from '../../../hooks/useDirectMessages';
import { useNavigate } from 'react-router-dom';

/**
 * DirectMessages - Direct message contacts display
 * Handles direct message user list and DM channel creation
 */
export const DirectMessages = ({ onChannelSelect, activeChannelId, channels }) => {
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dmChannels, setDmChannels] = useState([]);
  
  const { users, loading: usersLoading, searchUsers } = useUsers();
  const { createOrFindDMChannel, getOtherParticipant, isDMChannel, loading: dmLoading } = useDirectMessages();
  const navigate = useNavigate();

  // Filter DM channels from all channels
  useEffect(() => {
    if (!channels) return; // Add safety check
    
    const directMessageChannels = channels.filter(channel => isDMChannel(channel));
    setDmChannels(directMessageChannels);
  }, [channels, isDMChannel]);

  // Handle starting a DM conversation
  const handleStartDM = async (user) => {
    try {
      const dmChannel = await createOrFindDMChannel(user.id, user);
      
      setShowUserSearch(false);
      setSearchQuery('');
      
      // Navigate directly using React Router instead of relying on onChannelSelect
      // This ensures navigation works even if the channel isn't in the channels list yet
      navigate(`/channels/${dmChannel.id}/messages`);
      
      // Also call onChannelSelect as a backup if it exists
      if (onChannelSelect) {
        onChannelSelect(dmChannel.id);
      }
    } catch (error) {
      console.error('Error starting DM:', error);
    }
  };

  // Get user avatar color based on user ID
  const getUserAvatarColor = (userId) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-red-500', 'bg-orange-500', 'bg-teal-500'
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get user initials
  const getUserInitials = (user) => {
    if (user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get display name for user
  const getDisplayName = (user) => {
    return user.displayName || user.fullName || user.email?.split('@')[0] || 'Unknown User';
  };

  // Filter users based on search
  const filteredUsers = searchQuery ? searchUsers(searchQuery) : users;

  return (
    <div className="mt-4">
      {/* Section Header */}
      <div className="flex items-center px-2 py-1 mb-1">
        <User className="w-3 h-3 mr-2 text-indigo-300" />
        <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
          Direct Messages
        </span>
        <div className="flex-1 h-px bg-indigo-700/30 ml-2"></div>
        <button
          onClick={() => setShowUserSearch(!showUserSearch)}
          className="w-4 h-4 rounded hover:bg-indigo-700/50 flex items-center justify-center transition-colors ml-2"
          title="Start new DM"
        >
          <Plus className="w-3 h-3 text-indigo-300" />
        </button>
      </div>

      {/* User Search */}
      {showUserSearch && (
        <div className="px-2 mb-2">
          <div className="flex items-center bg-indigo-700/50 rounded-lg px-2 py-1 mb-2">
            <Search className="w-3 h-3 text-indigo-300 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-indigo-300 focus:outline-none w-full min-w-0"
              autoFocus
            />
          </div>
          
          {/* User List */}
          <div className="max-h-32 overflow-y-auto space-y-1">
            {usersLoading ? (
              <div className="text-xs text-indigo-300 px-2 py-1">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-xs text-indigo-300 px-2 py-1">
                {searchQuery ? 'No users found' : 'No users available'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartDM(user)}
                  disabled={dmLoading}
                  className="flex items-center w-full px-2 py-1 rounded text-indigo-200 hover:bg-indigo-700/50 transition-colors text-xs disabled:opacity-50"
                >
                  <div className={`w-4 h-4 rounded-full ${getUserAvatarColor(user.id)} flex items-center justify-center text-white text-xs mr-2 flex-shrink-0`}>
                    {getUserInitials(user)}
                  </div>
                  <span className="truncate">{getDisplayName(user)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Existing DM Channels */}
      {dmChannels.length > 0 && (
        <div className="space-y-1">
          {dmChannels.map((dmChannel) => {
            const otherParticipant = getOtherParticipant(dmChannel);
            if (!otherParticipant) return null;

            return (
              <button
                key={dmChannel.id}
                onClick={() => {
                  // Use navigate for existing DM channels too for consistency
                  navigate(`/channels/${dmChannel.id}/messages`);
                  // Also call onChannelSelect as backup
                  onChannelSelect && onChannelSelect(dmChannel.id);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-lg mb-1 transition-colors ${
                  dmChannel.id === activeChannelId
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-200 hover:bg-indigo-700/50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${getUserAvatarColor(otherParticipant.id)} flex items-center justify-center text-white text-xs mr-2 flex-shrink-0`}>
                  {getUserInitials(otherParticipant)}
                </div>
                <span 
                  className="truncate font-normal"
                  title={getDisplayName(otherParticipant)}
                >
                  {getDisplayName(otherParticipant)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {dmChannels.length === 0 && !showUserSearch && (
        <div className="px-2 py-1">
          <button
            onClick={() => setShowUserSearch(true)}
            className="text-xs text-indigo-300 hover:text-white transition-colors"
          >
            Click + to start a conversation
          </button>
        </div>
      )}
    </div>
  );
}; 