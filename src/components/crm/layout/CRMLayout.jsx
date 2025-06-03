import React from 'react';
import { Sidebar } from '../../messaging/layout/Sidebar';

/**
 * CRMLayout - Main CRM layout component
 * Provides the basic layout structure for the CRM system with full-width content
 */
export const CRMLayout = ({ 
  children,
  userProfile,
  currentUser,
  onLogout
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Navigation Bar */}
      <Sidebar 
        userProfile={userProfile}
        currentUser={currentUser}
        onLogout={onLogout}
        activeSection="crm"
      />

      {/* Main Content Area - Full width for CRM */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}; 