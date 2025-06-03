import React from 'react';
import { Sidebar } from './Sidebar';
import { ChannelSidebar } from './ChannelSidebar';
import { MainContent } from './MainContent';
import { useResizableSidebar } from '../../../hooks/useResizableSidebar';

/**
 * AppLayout - Main application layout component
 * Handles the three-column layout structure with resizable channel sidebar
 */
export const AppLayout = ({ 
  children,
  channels,
  activeChannelId,
  onChannelSelect,
  onCreateChannel,
  userProfile,
  currentUser,
  onLogout
}) => {
  // Resizable sidebar functionality
  const {
    sidebarWidth,
    isResizing,
    handleMouseDown
  } = useResizableSidebar(256, 200, 400);

  return (
    <div className="flex h-screen">
      {/* Left Navigation Bar */}
      <Sidebar 
        userProfile={userProfile}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Channels Sidebar */}
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onChannelSelect={onChannelSelect}
        onCreateChannel={onCreateChannel}
        width={sidebarWidth}
        onResizeStart={handleMouseDown}
        isResizing={isResizing}
      />

      {/* Main Content Area */}
      <MainContent>
        {children}
      </MainContent>
    </div>
  );
}; 