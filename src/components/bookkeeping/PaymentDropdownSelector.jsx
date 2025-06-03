import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const PaymentDropdownSelector = ({ 
  label,
  icon: Icon,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  className,
  disabled = false,
  error = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {Icon && <Icon className="inline h-4 w-4 mr-1" />}
        {label}
      </label>
      
      {/* Selected Option Display */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="py-1">
            {options.map((option) => {
              const isSelected = value === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                    isSelected ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Option Icon */}
                    {option.icon && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                        <option.icon className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    
                    {/* Option Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isSelected ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </p>
                      {option.description && (
                        <p className={`text-xs truncate ${
                          isSelected ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDropdownSelector; 