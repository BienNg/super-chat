import React from 'react';
import { Book } from 'lucide-react';

const StudentCoursesTab = ({ student }) => {
  return (
    <div className="space-y-6 p-1 h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-500">Enrolled Courses</h3>
        <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors">
          Enroll in Course
        </button>
      </div>
      
      {/* Show enrolled courses or placeholder */}
      <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center text-center h-[340px]">
        <Book className="h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-500">No courses enrolled yet</p>
        <p className="text-xs text-gray-400 mt-2 max-w-sm">Enroll this student in a course to get started</p>
      </div>
    </div>
  );
};

export default StudentCoursesTab; 