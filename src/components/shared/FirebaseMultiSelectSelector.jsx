import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Plus, ChevronDown, X } from 'lucide-react';
import { 
  doc, 
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * A reusable multi-select dropdown component that works with Firebase collections
 * 
 * @param {Object} props - Component props
 * @param {string} props.collectionName - Name of the Firebase collection to use
 * @param {Object} props.record - The record that will be updated (must have an id field)
 * @param {Function} props.updateRecord - Function to update the record (receives id and updates object)
 * @param {string} props.fieldName - The field name in the record to update
 * @param {string} props.fieldDisplayName - Display name for the field (for placeholder)
 * @param {Array} props.options - Array of string options (preloaded from a hook)
 * @param {Function} props.addOption - Function to add a new option to the collection
 * @param {string} props.addNewLabel - Label for the "Add New" option (default: "+ New Item...")
 * @param {string} props.searchPlaceholder - Placeholder for the search input
 * @param {string} props.noResultsText - Text to show when no results are found
 * @param {string} props.placeholder - Placeholder text when no value is selected
 * @param {boolean} props.allowEditExisting - Whether to allow editing when the field already has values (default: false)
 */
const FirebaseMultiSelectSelector = ({
  collectionName,
  record,
  updateRecord,
  fieldName,
  fieldDisplayName = 'item',
  options = [],
  addOption,
  addNewLabel = `New ${fieldDisplayName}...`,
  searchPlaceholder = `Search ${fieldDisplayName.toLowerCase()}s...`,
  noResultsText = `No ${fieldDisplayName.toLowerCase()}s found`,
  placeholder = `Select ${fieldDisplayName.toLowerCase()}s`,
  allowEditExisting = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  
  // Get the current selected values from the record
  const selectedValues = Array.isArray(record[fieldName]) ? record[fieldName] : [];
  
  // Determine if the field is editable - only if it's empty or editing existing values is allowed
  const isEmpty = selectedValues.length === 0;
  const isEditable = isEmpty || allowEditExisting;
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Also check if click is inside the dropdown portal
        const dropdownElement = document.querySelector('[data-dropdown-portal]');
        if (!dropdownElement || !dropdownElement.contains(event.target)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
      window.addEventListener('resize', handleResize);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-hide success message after 2 seconds
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Filter options to exclude already selected values
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !selectedValues.includes(option)
  );
      
  const handleSelect = async (selectedValue) => {
    try {
      setIsLoading(true);
      
      // Create a new array with the selected value added
      const newValues = [...selectedValues, selectedValue];
      
      const updates = {
        [fieldName]: newValues
      };
      
      try {
        await updateRecord(record.id, updates);
      } catch (err) {
        throw err;
      }
      
      setShowSuccess(true);
      setSearchTerm('');
      // Keep dropdown open after selection
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (valueToRemove) => {
    try {
      setIsLoading(true);
      
      // Create a new array without the removed value
      const newValues = selectedValues.filter(value => value !== valueToRemove);
      
      const updates = {
        [fieldName]: newValues
      };
      
      try {
        await updateRecord(record.id, updates);
      } catch (err) {
        throw err;
      }
      
      setShowSuccess(true);
    } catch (error) {
      console.error(`Error removing ${fieldName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (searchTerm.trim()) {
      try {
        setIsLoading(true);
        
        // First add the new option to the collection
        await addOption(searchTerm.trim());
        
        // Then update the record with the new value added to existing values
        const newValues = [...selectedValues, searchTerm.trim()];
        
        const updates = {
          [fieldName]: newValues
        };
        
        await updateRecord(record.id, updates);
        
        setShowSuccess(true);
        setSearchTerm('');
        // Keep dropdown open after adding
      } catch (error) {
        console.error(`Error adding new ${fieldName}:`, error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  return (
    <>
      <div className="relative w-full" ref={dropdownRef}>
        <div
          onClick={() => {
            if (!isLoading && isEditable) {
              if (!isOpen) {
                updateDropdownPosition();
              }
              setIsOpen(!isOpen);
            }
          }}
          className={`w-full py-2 flex items-center justify-between transition-colors ${
            isOpen ? 'bg-gray-50' : isLoading ? 'bg-gray-100' : isEditable ? 'hover:bg-gray-50' : ''
          } ${isLoading ? 'cursor-wait' : isEditable ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex-1 flex flex-wrap gap-1.5 min-h-[24px]">
            {selectedValues.length > 0 ? (
              selectedValues.map((value, index) => (
                <div 
                  key={index} 
                  className="inline-flex items-center bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  <span>{value}</span>
                  {isEditable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(value);
                      }}
                      className="ml-1.5 text-indigo-500 hover:text-indigo-700 rounded-full flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-400">{placeholder}</span>
            )}
          </div>
          
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          ) : showSuccess ? (
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : isEditable ? (
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          ) : null}
        </div>
      </div>

      {isOpen && ReactDOM.createPortal(
        <div 
          data-dropdown-portal
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            minWidth: '200px'
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={(event) => {
                    event.stopPropagation(); // Stop event from bubbling up
                    handleSelect(option);
                  }}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                  }}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-900 transition-colors"
                  data-value={option}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {noResultsText}
              </div>
            )}
          </div>

          {/* Add New Option */}
          {searchTerm.trim() && !options.some(option => 
            option.toLowerCase() === searchTerm.trim().toLowerCase()
          ) && (
            <div className="border-t border-gray-100">
              <div
                onClick={(event) => {
                  event.stopPropagation();
                  handleAddNew();
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-indigo-600 transition-colors flex items-center space-x-2"
                data-action={`add-new-${fieldName}`}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {addNewLabel}
                </span>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default FirebaseMultiSelectSelector; 