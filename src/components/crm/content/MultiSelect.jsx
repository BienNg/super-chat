import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Plus, MoreHorizontal } from 'lucide-react';

const MultiSelect = ({ 
  value = [], 
  onChange, 
  options = [], 
  placeholder = "Search and select...", 
  label,
  error,
  required = false,
  allowAddNew = false,
  onAddNew,
  onOpenSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term and exclude already selected
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option)
  );

  // Check if the search term is an exact match (case insensitive)
  const isExactMatch = searchTerm.trim() && 
    options.some(option => option.toLowerCase() === searchTerm.trim().toLowerCase());

  // Show add option if: allowAddNew is true, there's a search term, it's not an exact match, and it's not already selected
  const showAddOption = allowAddNew && 
    searchTerm.trim() && 
    !isExactMatch && 
    !value.includes(searchTerm.trim());

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
    if (!value.includes(option)) {
      onChange([...value, option]);
    }
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemove = (optionToRemove) => {
    onChange(value.filter(item => item !== optionToRemove));
  };

  const handleAddNew = () => {
    if (onAddNew && searchTerm.trim() && !isExactMatch) {
      onAddNew(searchTerm.trim());
      handleSelect(searchTerm.trim());
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && !searchTerm && value.length > 0) {
      // Remove last selected item when backspace is pressed and input is empty
      onChange(value.slice(0, -1));
    } else if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (showAddOption) {
        handleAddNew();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {onOpenSettings && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Manage options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Input Field with Tags */}
      <div 
        className={`relative w-full min-h-[48px] px-3 py-2 border rounded-xl cursor-text transition-colors ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : 'hover:border-gray-400'}`}
        onClick={handleInputClick}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Selected Tags */}
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
            >
              {item}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 placeholder-gray-500"
          />
        </div>
        
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform pointer-events-none ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {/* Existing Options */}
          {filteredOptions.length > 0 && (
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
          )}

          {/* Add New Option - Always at the bottom when typing */}
          {showAddOption && (
            <>
              {filteredOptions.length > 0 && <div className="border-t border-gray-100" />}
              <div
                onClick={handleAddNew}
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-indigo-700">
                      Add "{searchTerm.trim()}"
                    </div>
                    <div className="text-xs text-indigo-600">
                      Create new option
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {filteredOptions.length === 0 && !showAddOption && (
            <div className="py-6 px-4 text-center">
              {searchTerm.trim() ? (
                <div className="text-gray-500 text-sm">
                  {isExactMatch ? (
                    <div>
                      <div className="text-gray-600 font-medium">"{searchTerm.trim()}" already exists</div>
                      <div className="text-xs text-gray-500 mt-1">This option is already available</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-600">No matching options found</div>
                      <div className="text-xs text-gray-500 mt-1">Try a different search term</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  <div className="text-gray-600">Start typing to search...</div>
                  <div className="text-xs text-gray-500 mt-1">Type to find or create new options</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect; 