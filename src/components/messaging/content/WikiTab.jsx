import React from 'react';
import { BookOpen } from 'lucide-react';

/**
 * WikiTab - Wiki tab content component
 * Handles wiki page display and management
 */
export const WikiTab = ({ contentType, contentId }) => {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Wiki</h2>
        {contentType === 'page' && (
          <p className="text-sm mb-2">Page: {contentId}</p>
        )}
        <p className="text-sm">Coming soon...</p>
      </div>
    </div>
  );
}; 