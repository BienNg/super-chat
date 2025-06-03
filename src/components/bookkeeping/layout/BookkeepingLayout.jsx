import React from 'react';
import { Sidebar } from '../../messaging/layout';

/**
 * BookkeepingLayout - Layout wrapper for bookkeeping interface
 * Provides consistent layout structure with sidebar navigation
 */
const BookkeepingLayout = ({ children, userProfile, currentUser, onLogout }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar 
        userProfile={userProfile}
        currentUser={currentUser}
        onLogout={onLogout}
        activeSection="bookkeeping"
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default BookkeepingLayout; 