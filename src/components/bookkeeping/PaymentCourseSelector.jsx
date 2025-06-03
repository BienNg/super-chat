import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { useCourses } from '../../hooks/useCourses';

const PaymentCourseSelector = ({ 
  onSelectCourse, 
  selectedCourseId,
  className, 
  disabled = false,
  error = null,
  prefilledName = null,
  readOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { courses, loading, error: coursesError } = useCourses();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Find the selected course for display
  const selectedCourse = selectedCourseId ? 
    courses.find(course => course.id === selectedCourseId) : null;

  // Filter and sort courses based on search term
  const filteredCourses = courses
    .filter(course => {
      const matchesSearch = !searchTerm || 
                           course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (course.format && course.format.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (course.formatOption && course.formatOption.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    })
    .sort((a, b) => {
      const nameA = (a.courseName || a.name || '').toLowerCase();
      const nameB = (b.courseName || b.name || '').toLowerCase();
      return nameB.localeCompare(nameA); // Descending order
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

  const handleSelectCourse = (course) => {
    // Clear the input field and close dropdown
    setSearchTerm('');
    setIsOpen(false);
    
    // Call the parent callback with the course data
    onSelectCourse(course);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClearSelection = () => {
    onSelectCourse(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Generate consistent course icon color based on class name
  const getCourseIconColor = (course) => {
    const className = (course.courseName || course.name || '').split('-')[0].trim().toUpperCase();
    
    // Predefined colors for common class names
    const classColors = {
      'FREN': { background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }, // blue to cyan
      'SPAN': { background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' }, // pink to orange
      'GERM': { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }, // green
      'ITAL': { background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }, // purple
      'PORT': { background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' }, // red to pink
      'RUSS': { background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }, // orange to red
      'CHIN': { background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)' }, // yellow to orange
      'JAPA': { background: 'linear-gradient(135deg, #84cc16 0%, #eab308 100%)' }, // lime to yellow
      'KORE': { background: 'linear-gradient(135deg, #22c55e 0%, #84cc16 100%)' }, // green to lime
      'ARAB': { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }, // indigo to purple
      'ENGL': { background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)' }, // teal to green
      'MATH': { background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)' }  // sky to blue
    };
    
    // If we have a predefined color for this class, use it
    if (classColors[className]) {
      return classColors[className];
    }
    
    // Generate a consistent color based on class name hash
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
      hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to a color index
    const colorIndex = Math.abs(hash) % 12;
    const generatedColors = [
      { background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }, // blue to cyan
      { background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' }, // pink to orange
      { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }, // green
      { background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }, // purple
      { background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' }, // red to pink
      { background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }, // orange to red
      { background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)' }, // yellow to orange
      { background: 'linear-gradient(135deg, #84cc16 0%, #eab308 100%)' }, // lime to yellow
      { background: 'linear-gradient(135deg, #22c55e 0%, #84cc16 100%)' }, // green to lime
      { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }, // indigo to purple
      { background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)' }, // teal to green
      { background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)' }  // sky to blue
    ];
    
    return generatedColors[colorIndex];
  };

  const getCourseInitials = (course) => {
    const name = course.courseName || course.name || '';
    
    // Extract class name (part before the "-")
    const className = name.split('-')[0].trim();
    
    if (className) {
      // Return the full class name since it's already 3-4 characters
      return className.toUpperCase();
    }
    
    // Fallback
    return 'CRS';
  };

  const getFormatBadgeStyle = (format) => {
    const formatStyles = {
      'Online': 'bg-blue-100 text-blue-800',
      'Offline': 'bg-green-100 text-green-800',
      'Hybrid': 'bg-purple-100 text-purple-800'
    };
    
    return formatStyles[format] || 'bg-gray-100 text-gray-800';
  };

  const getDisplayName = (course) => {
    return course.courseName || course.name || 'Unnamed Course';
  };

  const getDisplaySubtext = (course) => {
    const parts = [];
    if (course.level) parts.push(course.level);
    if (course.format) parts.push(course.format);
    if (course.formatOption) parts.push(course.formatOption);
    return parts.join(' • ') || 'Course details';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <BookOpen className="inline h-4 w-4 mr-1" />
        Course
      </label>
      
      {/* Selected Course Display or Input Field */}
      {(selectedCourse && !isOpen) || (readOnly && prefilledName) ? (
        <div 
          onClick={readOnly ? undefined : () => setIsOpen(true)}
          className={`w-full px-3 py-2 border rounded-lg transition-colors ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}`}
        >
          <div className="flex items-center space-x-3">
            {/* Course Icon */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: getCourseIconColor(selectedCourse || { courseName: prefilledName }).background }}
            >
              <span className="text-[10px] font-bold text-white">
                {selectedCourse ? getCourseInitials(selectedCourse) :
                 prefilledName ? prefilledName.split('-')[0]?.trim().toUpperCase() || 'CRS' : 'CRS'}
              </span>
            </div>
            
            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedCourse ? getDisplayName(selectedCourse) : prefilledName || 'Unknown Course'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {selectedCourse ? getDisplaySubtext(selectedCourse) : (readOnly ? 'Pre-selected course' : '')}
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
            placeholder={selectedCourse ? "Search to change course..." : (readOnly ? "Course is pre-selected" : "Search for a course...")}
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
              <span className="mt-2 block">Loading courses...</span>
            </div>
          ) : coursesError ? (
            <div className="px-4 py-3 text-sm text-red-600 text-center">
              Error loading courses: {coursesError}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {searchTerm ? 'No courses found matching your search' : 'No courses available'}
            </div>
          ) : (
            <div className="py-1">
              {filteredCourses.map((course) => {
                const iconColor = getCourseIconColor(course);
                const isSelected = selectedCourseId === course.id;
                
                return (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                      isSelected ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Course Icon */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: iconColor.background }}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {getCourseInitials(course)}
                        </span>
                      </div>
                      
                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium truncate ${
                            isSelected ? 'text-indigo-900' : 'text-gray-900'
                          }`}>
                            {getDisplayName(course)}
                          </p>
                        </div>
                        <p className={`text-xs truncate ${
                          isSelected ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                          {getDisplaySubtext(course)}
                        </p>
                      </div>
                      
                      {/* Format Badge */}
                      <div className="flex-shrink-0">
                        {course.format && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFormatBadgeStyle(course.format)}`}>
                            {course.format}
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

export default PaymentCourseSelector; 