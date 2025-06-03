import React, { useState } from 'react';
import { 
  Plus, 
  Search
} from 'lucide-react';
import { ChannelList } from './ChannelList';
import { DirectMessages } from './DirectMessages';
import { ResizeHandle } from './ResizeHandle';

/**
 * ChannelSidebar - Channel navigation and organization
 * Handles channel listing, search, and direct messages with resizable width
 */
export const ChannelSidebar = ({ 
  channels, 
  activeChannelId, 
  onChannelSelect, 
  onCreateChannel,
  width = 256,
  onResizeStart,
  isResizing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="bg-indigo-800 text-white flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold truncate">Channels</h1>
        <button 
          onClick={onCreateChannel}
          className="w-8 h-8 rounded-lg hover:bg-indigo-700 flex items-center justify-center transition-colors flex-shrink-0"
          title="Create Channel"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="flex items-center bg-indigo-700/50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-indigo-300 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search channels"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm text-white placeholder-indigo-300 focus:outline-none w-full min-w-0"
          />
        </div>
      </div>

      {/* Scrollable Content Area - Contains both channels and direct messages */}
      <div className="flex-1 overflow-y-auto px-2">
        <ChannelList
          channels={filteredChannels}
          activeChannelId={activeChannelId}
          onChannelSelect={onChannelSelect}
        />
        
        {/* Direct Messages - Now inside scrollable area */}
        <DirectMessages 
          onChannelSelect={onChannelSelect}
          activeChannelId={activeChannelId}
          channels={channels}
        />
      </div>

      {/* Resize Handle */}
      <ResizeHandle 
        onMouseDown={onResizeStart}
        isResizing={isResizing}
      />
    </div>
  );
}; 