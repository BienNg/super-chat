import React, { useState, useEffect, useRef } from 'react';
import { Search, User } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';

const PaymentStudentSelector = ({ 
  onSelectStudent, 
  selectedStudentId,
  className, 
  disabled = false,
  error = null,
  prefilledName = null,
  readOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { students, loading, error: studentsError } = useStudents();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Find the selected student for display
  const selectedStudent = selectedStudentId ? 
    students.find(student => student.id === selectedStudentId) : null;

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
                         student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStudent = (student) => {
    // Clear the input field and close dropdown
    setSearchTerm('');
    setIsOpen(false);
    
    // Call the parent callback with the student data
    onSelectStudent(student);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClearSelection = () => {
    onSelectStudent(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Generate consistent avatar color
  const getAvatarColor = (name) => {
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
    
    const nameHash = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    return avatarColors[nameHash % avatarColors.length];
  };

  const getStudentInitials = (student) => {
    const name = student.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <User className="inline h-4 w-4 mr-1" />
        Student
      </label>
      
      {/* Selected Student Display or Input Field */}
      {(selectedStudent && !isOpen) || (readOnly && prefilledName) ? (
        <div 
          onClick={readOnly ? undefined : () => setIsOpen(true)}
          className={`w-full px-3 py-2 border rounded-lg transition-colors ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}`}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: getAvatarColor(selectedStudent?.name || prefilledName).background }}
            >
              <span className="text-xs font-bold text-white">
                {selectedStudent ? getStudentInitials(selectedStudent) : 
                 prefilledName ? prefilledName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </span>
            </div>
            
            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedStudent?.name || prefilledName || 'Unknown Student'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {selectedStudent?.email || (readOnly ? 'Pre-selected student' : '')}
              </p>
            </div>
            
            {/* Clear button */}
            {!readOnly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSelection();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ) : (
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
            disabled={disabled || readOnly}
            className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors ${
              error ? 'border-red-300' : 'border-gray-300'
            } ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`}
            placeholder={selectedStudent ? "Search to change student..." : (readOnly ? "Student is pre-selected" : "Search for a student...")}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && !readOnly && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mx-auto"></div>
              <span className="mt-2 block">Loading students...</span>
            </div>
          ) : studentsError ? (
            <div className="px-4 py-3 text-sm text-red-600 text-center">
              Error loading students: {studentsError}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {searchTerm ? 'No students found matching your search' : 'No students available'}
            </div>
          ) : (
            <div className="py-1">
              {filteredStudents.map((student) => {
                const avatarColor = getAvatarColor(student.name);
                const isSelected = selectedStudentId === student.id;
                
                return (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                      isSelected ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: avatarColor.background }}
                      >
                        <span className="text-xs font-bold text-white">
                          {getStudentInitials(student)}
                        </span>
                      </div>
                      
                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium truncate ${
                            isSelected ? 'text-indigo-900' : 'text-gray-900'
                          }`}>
                            {student.name}
                          </p>
                        </div>
                        <p className={`text-xs truncate ${
                          isSelected ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                          {student.email}
                        </p>
                      </div>
                      
                      {/* Location Display */}
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

export default PaymentStudentSelector; 