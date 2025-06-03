import React, { useState, useEffect } from 'react';
import { useChannelManagement } from '../../hooks/useChannelManagement';

// Avatar color system from design guide
const getAvatarColor = (userId) => {
  const colors = [
    'bg-blue-500',    // Blue
    'bg-green-500',   // Green  
    'bg-purple-500',  // Purple
    'bg-pink-500',    // Pink
    'bg-yellow-500',  // Yellow
    'bg-red-500',     // Red
    'bg-orange-500',  // Orange
    'bg-teal-500'     // Teal
  ];
  
  // Use a simple hash of the userId to consistently assign colors
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getUserInitials = (user) => {
  if (user.displayName) {
    return user.displayName.split(' ').map(name => name.charAt(0)).slice(0, 2).join('').toUpperCase();
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return 'U';
};

const MemberAvatarStack = ({ 
  channel, 
  maxVisible = 4, 
  size = 'sm',
  showTooltip = true,
  onStackClick
}) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getAllUsers } = useChannelManagement();

  useEffect(() => {
    if (channel?.members?.length > 0) {
      fetchMemberDetails();
    } else {
      setMembers([]);
    }
  }, [channel?.members]);

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      const channelMembers = allUsers.filter(user => 
        channel.members.includes(user.id)
      );
      setMembers(channelMembers);
    } catch (error) {
      console.error('Error fetching member details:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Early return for channels without members
  if (!channel?.members?.length) {
    return null;
  }

  // Size variants following design system
  const sizeClasses = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-xs', 
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-sm'
  };

  const handleStackClick = () => {
    if (onStackClick) {
      onStackClick();
    }
  };

  // Common container with click handler
  const StackContainer = ({ children, className = "" }) => {
    if (onStackClick) {
      return (
        <button
          onClick={handleStackClick}
          className={`flex items-center hover:bg-gray-50 rounded-lg p-1 transition-colors duration-200 ${className}`}
          title={showTooltip ? "View channel members" : undefined}
        >
          {children}
        </button>
      );
    }
    return (
      <div className={`flex items-center ${className}`}>
        {children}
      </div>
    );
  };

  // Show loading state with skeleton avatars
  if (loading) {
    return (
      <StackContainer>
        <div className="flex -space-x-1">
          {Array.from({ length: Math.min(maxVisible, channel.members.length) }).map((_, index) => (
            <div
              key={index}
              className={`
                ${sizeClasses[size]}
                bg-gray-300
                rounded-full
                border-2
                border-white
                shadow-sm
                animate-pulse
                relative
              `}
              style={{ zIndex: maxVisible - index }}
            />
          ))}
        </div>
      </StackContainer>
    );
  }

  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, channel.members.length - maxVisible);

  // Fallback: if we couldn't fetch member details, show basic count
  if (members.length === 0 && channel.members.length > 0) {
    return (
      <StackContainer>
        <div className="flex -space-x-1">
          {Array.from({ length: Math.min(maxVisible, channel.members.length) }).map((_, index) => (
            <div
              key={index}
              className={`
                ${sizeClasses[size]}
                bg-gray-400
                rounded-full
                flex
                items-center
                justify-center
                text-white
                font-medium
                border-2
                border-white
                shadow-sm
                relative
              `}
              style={{ zIndex: maxVisible - index }}
              title={showTooltip && !onStackClick ? 'Channel member' : undefined}
            >
              ?
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              className={`
                ${sizeClasses[size]}
                bg-gray-500
                rounded-full
                flex
                items-center
                justify-center
                text-white
                font-medium
                border-2
                border-white
                shadow-sm
                relative
              `}
              style={{ zIndex: 0 }}
              title={showTooltip && !onStackClick ? `+${remainingCount} more members` : undefined}
            >
              +{remainingCount}
            </div>
          )}
        </div>
        <span className="ml-2 text-sm text-gray-500">
          {channel.members.length} member{channel.members.length !== 1 ? 's' : ''}
        </span>
      </StackContainer>
    );
  }

  return (
    <StackContainer>
      {/* Avatar Stack */}
      <div className="flex -space-x-1">
        {visibleMembers.map((member, index) => (
          <div
            key={member.id}
            className={`
              ${sizeClasses[size]} 
              ${getAvatarColor(member.id)} 
              rounded-full 
              flex 
              items-center 
              justify-center 
              text-white 
              font-medium 
              border-2 
              border-white 
              shadow-sm
              relative
              ${onStackClick ? '' : 'hover:scale-110'}
              transition-transform
              duration-200
            `}
            style={{ zIndex: maxVisible - index }}
            title={showTooltip && !onStackClick ? (member.displayName || member.email) : undefined}
          >
            {getUserInitials(member)}
          </div>
        ))}
        
        {/* Overflow indicator */}
        {remainingCount > 0 && (
          <div
            className={`
              ${sizeClasses[size]}
              bg-gray-400
              rounded-full
              flex
              items-center
              justify-center
              text-white
              font-medium
              border-2
              border-white
              shadow-sm
              relative
              ${onStackClick ? '' : 'hover:scale-110'}
              transition-transform
              duration-200
            `}
            style={{ zIndex: 0 }}
            title={showTooltip && !onStackClick ? `+${remainingCount} more members` : undefined}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      
      {/* Member count text - only shown for larger sizes */}
      {(size === 'md' || size === 'lg') && (
        <span className="ml-2 text-sm text-gray-500">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      )}
    </StackContainer>
  );
};

export default MemberAvatarStack; 