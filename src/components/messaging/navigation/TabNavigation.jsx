import React from 'react';
import { User, Globe, Clock } from 'lucide-react';
import { generateChannelUrl, getMiddleClickHandlers } from '../../../utils/navigation';
import { useDirectMessages } from '../../../hooks/useDirectMessages';
import { useAuth } from '../../../contexts/AuthContext';
import { useClasses } from '../../../hooks/useClasses';
import MemberAvatarStack from '../../shared/MemberAvatarStack';

/**
 * TabNavigation - Channel tab navigation component
 * Handles tab display and switching for channel content
 * Shows appropriate header for DM channels vs regular channels
 */
export const TabNavigation = ({ 
  tabs, 
  currentTab, 
  onTabSelect,
  channel,
  onChannelClick,
  onOpenChannelMembers
}) => {
  const { getOtherParticipant, isDMChannel } = useDirectMessages();
  const { currentUser } = useAuth();
  const { classes } = useClasses(channel?.id);
  const classInfo = classes && classes.length > 0 ? classes[0] : null;

  if (!channel) return null;

  // Check if this is a DM channel and get the other participant
  const isDirectMessage = isDMChannel(channel);
  const otherParticipant = isDirectMessage ? getOtherParticipant(channel) : null;

  // Get display name for the channel header
  const getChannelDisplayName = () => {
    if (isDirectMessage && otherParticipant) {
      return otherParticipant.displayName || otherParticipant.fullName || otherParticipant.email?.split('@')[0] || 'Unknown User';
    }
    return channel.name;
  };

  // Get header icon
  const getHeaderIcon = () => {
    if (isDirectMessage) {
      return <User className="w-5 h-5 mr-2 text-gray-600" />;
    }
    return '#';
  };

  // Render format/location for class channels
  const renderClassMeta = () => {
    if (channel.type !== 'class' || !classInfo) return null;
    
    const hasFormatInfo = classInfo.format || classInfo.formatOption;
    const hasTimeInfo = classInfo.startTime || classInfo.endTime || classInfo.timezone;
    
    if (!hasFormatInfo && !hasTimeInfo) return null;
    
    return (
      <span className="flex items-center ml-2 gap-2 text-gray-700 text-xs">
        {hasFormatInfo && (
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-500" />
            <span className="font-semibold">{classInfo.format}</span>
            {classInfo.format && classInfo.formatOption && <span className="mx-1">·</span>}
            {classInfo.formatOption && <span>{classInfo.formatOption}</span>}
          </span>
        )}
        
        {hasTimeInfo && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-500" />
            <span className="font-semibold">
              {classInfo.startTime && classInfo.endTime 
                ? `${classInfo.startTime} - ${classInfo.endTime}`
                : classInfo.startTime || classInfo.endTime || 'Time not set'
              }
            </span>
            {classInfo.timezone && (
              <>
                <span className="mx-1">·</span>
                <span className="uppercase font-medium">{classInfo.timezone}</span>
              </>
            )}
          </span>
        )}
      </span>
    );
  };

  return (
    <>
      {/* Channel Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onChannelClick}
            className="flex items-center text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {getHeaderIcon()}
            <span className="flex items-center">
              {getChannelDisplayName()}
              {renderClassMeta()}
            </span>
          </button>
          {/* Show "Direct message" text for DMs */}
          {isDirectMessage && (
            <span className="ml-2 text-sm text-gray-500">
              Direct message
            </span>
          )}
        </div>
        
        {/* Member Avatar Stack - positioned at top right for non-DM channels */}
        {!isDirectMessage && (
          <div className="flex items-center">
            <MemberAvatarStack 
              channel={channel} 
              maxVisible={4} 
              size="sm" 
              showTooltip={true}
              onStackClick={onOpenChannelMembers}
            />
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center px-6 border-b">
        {tabs.map((tab) => {
          const tabUrl = generateChannelUrl(channel.id, tab.id);
          const middleClickHandlers = getMiddleClickHandlers(
            tabUrl,
            () => onTabSelect(tab.label)
          );

          return (
            <button
              key={tab.id}
              onClick={() => onTabSelect(tab.label)}
              {...middleClickHandlers}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
}; 