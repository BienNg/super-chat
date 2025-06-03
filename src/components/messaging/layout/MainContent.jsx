import React from 'react';

/**
 * MainContent - Main content area wrapper
 * Provides consistent styling for the main content area
 */
export const MainContent = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {children}
    </div>
  );
}; 