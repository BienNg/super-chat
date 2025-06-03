import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useStudents } from '../../../../hooks/useStudents';
import { useEnrollments } from '../../../../hooks/useEnrollments';

const StudentSelector = ({ 
  onSelectStudent, 
  className, 
  disabled = false, 
  courseId,
  courseName,
  courseLevel,
  classId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { students, loading, error } = useStudents();
  const { isStudentEnrolled } = useEnrollments();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter students based on search term and exclude already enrolled students
  const filteredStudents = students.filter(student => {
    // Use the isStudentEnrolled hook as the single source of truth for enrollment status
    // Check enrollment using the student's database ID (student.id)
    const isAlreadyEnrolled = courseId && student.id 
      ? isStudentEnrolled(student.id, courseId)
      : false;
    
    // Filter by search term
    const matchesSearch = !searchTerm || 
                         student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return !isAlreadyEnrolled && matchesSearch;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStudent = (student) => {
    // Clear the input field and close dropdown
    setSearchTerm('');
    setIsOpen(false);
    
    // Generate a better avatar color based on the student's name using inline styles
    const avatarColors = [
      { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }, // indigo to purple
      { background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }, // blue to cyan
      { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }, // green to emerald
      { background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)' }, // yellow to orange
      { background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' }, // red to pink
      { background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }, // purple to indigo
      { background: 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)' }, // teal to blue
      { background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }  // orange to red
    ];
    
    // Generate color based on name hash for consistency
    const nameHash = student.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectedColor = avatarColors[nameHash % avatarColors.length];
    
    // Prepare enrollment data for the new enrollment system
    const enrollmentData = {
      // References
      studentId: student.id, // Use the student's database ID from the students collection
      courseId: courseId,
      classId: classId,
      
      // Denormalized student data
      studentName: student.name,
      studentEmail: student.email || '',
      
      // Denormalized course data
      courseName: courseName || '',
      courseLevel: courseLevel || '',
      
      // Denormalized class data
      className: className || '',
      
      // Legacy format for backward compatibility with existing components
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      amount: 0, // Default amount, can be updated later
      currency: 'VND',
      status: 'active',
      notes: '',
      avatar: student.avatar || student.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      avatarColor: student.avatarColor || selectedColor
    };
    
    // Call the parent callback with the enrollment data
    onSelectStudent(enrollmentData);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${className}`}
          placeholder="Search existing students..."
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mx-auto"></div>
              <span className="mt-2 block">Loading students...</span>
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-sm text-red-600 text-center">
              Error loading students: {error}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {searchTerm ? 'No available students found matching your search' : 'No available students to add'}
            </div>
          ) : (
            <div className="py-1">
              {filteredStudents.map((student) => {
                // Generate consistent avatar color for display
                const avatarColors = [
                  { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }, // indigo to purple
                  { background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }, // blue to cyan
                  { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }, // green to emerald
                  { background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)' }, // yellow to orange
                  { background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' }, // red to pink
                  { background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }, // purple to indigo
                  { background: 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)' }, // teal to blue
                  { background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }  // orange to red
                ];
                const nameHash = student.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const avatarColor = student.avatarColor || avatarColors[nameHash % avatarColors.length];
                
                return (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`} style={{ background: avatarColor.background }}>
                        <span className="text-xs font-bold text-white">
                          {student.avatar || student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                      </div>
                      
                      {/* Country Display */}
                      <div className="flex-shrink-0">
                        {student.location && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentSelector;