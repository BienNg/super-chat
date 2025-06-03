import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import EmojiPickerWrapper from './composition/EmojiPickerWrapper';

const MessageReactions = ({ 
  messageId, 
  reactions = [], 
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  onViewReactionDetails,
  className = '' 
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const addReactionButtonRef = useRef(null);

  // Get a consistent color based on user email or name (same as message style)
  const getAuthorColor = (user) => {
    if (!user) return '#6B7280';
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#6366F1', '#EC4899'];
    const str = user.name || user.email || '';
    const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Get author initials for avatar (same as message style)
  const getAuthorInitials = (user) => {
    if (!user) return '?';
    return user.name?.charAt(0) || user.email?.charAt(0) || '?';
  };

  // Group reactions by emoji and count them
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const { emoji, userId, user } = reaction;
    if (!acc[emoji]) {
      acc[emoji] = {
        emoji,
        count: 0,
        users: [],
        hasCurrentUser: false
      };
    }
    acc[emoji].count++;
    acc[emoji].users.push(user);
    if (userId === currentUserId) {
      acc[emoji].hasCurrentUser = true;
    }
    return acc;
  }, {});

  const reactionGroups = Object.values(groupedReactions);

  const handleReactionClick = async (emoji) => {
    const reactionGroup = groupedReactions[emoji];
    try {
      if (reactionGroup.hasCurrentUser) {
        // Remove reaction if user already reacted with this emoji
        await onRemoveReaction?.(messageId, emoji);
      } else {
        // Add reaction if user hasn't reacted with this emoji
        await onAddReaction?.(messageId, emoji);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleAddNewReaction = async (emoji) => {
    try {
      await onAddReaction?.(messageId, emoji);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
      setShowEmojiPicker(false);
    }
  };

  const handleReactionDetails = (emoji, users) => {
    onViewReactionDetails?.(messageId, emoji, users);
  };

  return (
    <div className={`message-reactions flex flex-wrap items-center gap-1 mt-1 ${className} ${reactionGroups.length === 0 ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
      {reactionGroups.map(({ emoji, count, users, hasCurrentUser }) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          onDoubleClick={() => handleReactionDetails(emoji, users)}
          className={`reaction-button flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all duration-200 hover:scale-105 ${
            hasCurrentUser
              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
          title={`${users.map(u => u.name).join(', ')} reacted with ${emoji}`}
        >
          <span className="text-sm">{emoji}</span>
          <span className="font-medium">{count}</span>
          
          {/* Show user avatars for all reactions */}
          <div className="flex -space-x-1 ml-1">
            {users.slice(0, 3).map((user, index) => (
              <div
                key={`${user.id}-${index}`}
                className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px] font-medium text-white overflow-hidden"
                style={{ backgroundColor: user.avatar ? undefined : getAuthorColor(user) }}
                title={user.name}
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getAuthorInitials(user)
                )}
              </div>
            ))}
            {count > 3 && (
              <div
                className="w-4 h-4 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] font-medium text-gray-600"
                title={`${count - 3} more`}
              >
                +{count - 3}
              </div>
            )}
          </div>
        </button>
      ))}

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          ref={addReactionButtonRef}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="add-reaction-button flex items-center justify-center w-6 h-6 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"
          title="Add reaction"
        >
          <Plus className="w-3 h-3" />
        </button>

        {/* Emoji Picker for Adding Reactions */}
        {showEmojiPicker && (
          <EmojiPickerWrapper
            onEmojiSelect={handleAddNewReaction}
            onClose={() => setShowEmojiPicker(false)}
            triggerRef={addReactionButtonRef}
            className="reaction-emoji-picker"
          />
        )}
      </div>

      <style jsx>{`
        .reaction-button:active {
          transform: scale(0.95);
        }
        
        .add-reaction-button:hover {
          transform: scale(1.1);
        }
        
        .reaction-emoji-picker {
          width: 380px !important;
          max-height: 320px !important;
        }
      `}</style>
    </div>
  );
};

export default MessageReactions; 