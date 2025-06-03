import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

const CustomSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select option", 
  label,
  error,
  required = false,
  allowAddNew = false,
  onAddNew,
  addNewLabel = "New Type..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddNew = () => {
    if (onAddNew && searchTerm.trim()) {
      onAddNew(searchTerm.trim());
      onChange(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(!isOpen);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const displayValue = value || '';

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Input Field */}
      <div 
        className={`relative w-full px-4 py-3 border rounded-xl cursor-pointer transition-colors ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : 'hover:border-gray-400'}`}
        onClick={handleInputClick}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500"
          readOnly={!isOpen}
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {/* Options */}
          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-900 transition-colors"
                >
                  {option}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 px-4 text-gray-500 text-sm">
              No options found
            </div>
          )}

          {/* Add New Option */}
          {allowAddNew && searchTerm.trim() && !options.includes(searchTerm.trim()) && (
            <div className="border-t border-gray-100">
              <div
                onClick={handleAddNew}
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-indigo-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Add "{searchTerm.trim()}"
                </span>
              </div>
            </div>
          )}

          {/* Default Add New Option */}
          {allowAddNew && !searchTerm.trim() && (
            <div className="border-t border-gray-100">
              <div
                onClick={() => {
                  if (onAddNew) {
                    onAddNew('');
                  }
                }}
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-indigo-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">{addNewLabel}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect; 