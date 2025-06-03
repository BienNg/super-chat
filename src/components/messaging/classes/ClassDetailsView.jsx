import React from 'react';
import { BookOpen } from 'lucide-react';

const ClassDetailsView = ({ channelId, channelName }) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Info Tab</h3>
        <p className="mt-1 text-sm text-gray-500">
          This tab is currently empty. All class information and student management has been moved to the Courses tab.
        </p>
      </div>
    </div>
  );
};

export default ClassDetailsView; 