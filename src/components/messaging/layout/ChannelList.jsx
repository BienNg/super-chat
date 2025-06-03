import React, { useState } from 'react';
import { Plus, Hash } from 'lucide-react';
import { generateChannelUrl, getMiddleClickHandlers } from '../../../utils/navigation';
import { CHANNEL_TYPE_METADATA, getChannelTypeMetadata, getChannelTypePriority } from '../../../utils/channelTypes';
import { ChannelTypeModal } from './ChannelTypeModal';

/**
 * ChannelList - Organized channel display with grouping
 * Handles channel grouping by type and visual organization
 * Excludes DM channels which are handled by DirectMessages component
 */
export const ChannelList = ({ channels, activeChannelId, onChannelSelect }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChannelType, setSelectedChannelType] = useState(null);
  const [selectedMetadata, setSelectedMetadata] = useState(null);

  // Filter out DM channels - they're handled by DirectMessages component
  const regularChannels = channels.filter(channel => 
    !channel.isDM && channel.type !== 'direct-message'
  );

  // Group channels by type
  const groupedChannels = regularChannels.reduce((groups, channel) => {
    const type = channel.type || 'general';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(channel);
    return groups;
  }, {});

  // Sort groups by priority and channels within groups by name
  const sortedGroups = Object.entries(groupedChannels)
    .sort(([a], [b]) => {
      return getChannelTypePriority(a) - getChannelTypePriority(b);
    })
    .map(([type, channelList]) => [
      type,
      channelList.sort((a, b) => a.name.localeCompare(b.name))
    ]);

  const handleChannelTypeClick = (type, metadata) => {
    setSelectedChannelType(type);
    setSelectedMetadata(metadata);
    setModalOpen(true);
  };

  const renderChannel = (channel) => {
    const metadata = getChannelTypeMetadata(channel.type);
    const Icon = metadata.icon;
    const isActive = channel.id === activeChannelId;
    const url = generateChannelUrl(channel.id, 'messages');
    
    return (
      <button
        key={channel.id}
        onClick={() => onChannelSelect(channel.id)}
        {...getMiddleClickHandlers(url)}
        className={`flex items-center w-full px-3 py-2 rounded-lg mb-1 transition-colors group ${
          isActive
            ? 'bg-indigo-700 text-white'
            : 'text-indigo-200 hover:bg-indigo-700/50 hover:text-white'
        }`}
      >
        <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
        <span 
          className="truncate font-normal"
          title={channel.name}
        >
          {channel.name}
        </span>
      </button>
    );
  };

  if (regularChannels.length === 0) {
    return (
      <div className="text-center py-8">
        <Hash className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
        <p className="text-indigo-300 text-sm mb-4">No channels available</p>
        <button className="text-indigo-400 hover:text-white text-sm flex items-center mx-auto">
          <Plus className="w-4 h-4 mr-1" />
          Create Channel
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sortedGroups.map(([type, channelList]) => {
          const metadata = getChannelTypeMetadata(type);
          
          return (
            <div key={type} className="space-y-1">
              {/* Group Header - Now Clickable */}
              <button
                onClick={() => handleChannelTypeClick(type, metadata)}
                className="flex items-center px-2 py-1 mb-2 w-full hover:bg-indigo-700/30 rounded-md transition-colors group"
              >
                <metadata.icon className="w-3 h-3 mr-2 text-indigo-300 group-hover:text-indigo-200" />
                <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider group-hover:text-indigo-200">
                  {metadata.label}
                </span>
                <div className="flex-1 h-px bg-indigo-700/30 ml-2 group-hover:bg-indigo-600/40"></div>
                <span className="text-xs text-indigo-400 group-hover:text-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  Click to manage
                </span>
              </button>
              
              {/* Channels in Group */}
              <div className="space-y-1">
                {channelList.map(renderChannel)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel Type Modal */}
      <ChannelTypeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        channelType={selectedChannelType}
        metadata={selectedMetadata}
      />
    </>
  );
}; 