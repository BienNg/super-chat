import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Plus, ChevronDown, X } from 'lucide-react';

/**
 * A reusable multi-select dropdown component that works with backend collections (now Supabase-oriented)
 * 
 * @param {Object} props - Component props
 * @param {string} props.collectionName - Name of the Supabase table (passed to addOption if it needs it)
 * @param {Object} props.record - The record that will be updated (must have an id field)
 * @param {Function} props.updateRecord - Function to update the record (receives id and updates object)
 * @param {string} props.fieldName - The field name in the record to update (expected to be an array)
 * @param {string} props.fieldDisplayName - Display name for the field (for placeholder)
 * @param {Array} props.options - Array of string options (preloaded from a hook, now Supabase-based)
 * @param {Function} props.addOption - Function to add a new option (receives new value, interacts with Supabase)
 * @param {string} props.addNewLabel - Label for the "Add New" option (default: "+ New Item...")
 * @param {string} props.searchPlaceholder - Placeholder for the search input
 * @param {string} props.noResultsText - Text to show when no results are found
 * @param {string} props.placeholder - Placeholder text when no value is selected
 * @param {boolean} props.allowEditExisting - Whether to allow editing when the field already has values (default: false)
 */
const SupabaseMultiSelectSelector = ({
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

  const selectedValues = Array.isArray(record[fieldName]) ? record[fieldName] : [];
  const isEmpty = selectedValues.length === 0;
  const isEditable = isEmpty || allowEditExisting;
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const dropdownElement = document.querySelector('[data-dropdown-portal]');
        if (!dropdownElement || !dropdownElement.contains(event.target)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      }
    };

    const handleScroll = () => { if (isOpen) updateDropdownPosition(); };
    const handleResize = () => { if (isOpen) updateDropdownPosition(); };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !selectedValues.includes(option)
  );
  
  const handleSelect = async (selectedValue) => {
    try {
      setIsLoading(true);
      const newValues = [...selectedValues, selectedValue];
      const updates = { [fieldName]: newValues };
        await updateRecord(record.id, updates);
      setShowSuccess(true);
      setSearchTerm('');
    } catch (error) {
      console.error(`Error selecting ${fieldName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (valueToRemove) => {
    try {
      setIsLoading(true);
      const newValues = selectedValues.filter(value => value !== valueToRemove);
      const updates = { [fieldName]: newValues };
        await updateRecord(record.id, updates);
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
        const newOptionValue = searchTerm.trim();
        await addOption(newOptionValue, collectionName);
        
        const newValues = [...selectedValues, newOptionValue];
        const updates = { [fieldName]: newValues };
        await updateRecord(record.id, updates);
        
        setShowSuccess(true);
        setSearchTerm('');
      } catch (error) {
        console.error(`Error adding new ${fieldName}:`, error);
      } finally {
        setIsLoading(false);
      }
    }
  };

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
              if (!isOpen) updateDropdownPosition();
              setIsOpen(!isOpen);
            }
          }}
          className={`w-full py-2 flex items-center justify-between transition-colors min-h-[40px] border border-transparent hover:border-gray-300 rounded-md px-2 ${
            isOpen ? 'bg-gray-50 border-gray-300' : isLoading ? 'bg-gray-100' : isEditable ? 'hover:bg-gray-50' : 'bg-gray-100'
          } ${isLoading ? 'cursor-wait' : isEditable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        >
          <div className="flex-1 flex flex-wrap gap-1.5">
            {selectedValues.length > 0 ? (
              selectedValues.map((value, index) => (
                <div 
                  key={`${value}-${index}`}
                  className="inline-flex items-center bg-indigo-100 text-indigo-700 rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  <span>{value}</span>
                  {isEditable && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(value);
                      }}
                      className="ml-1.5 -mr-0.5 text-indigo-500 hover:text-indigo-700 rounded-full flex items-center justify-center p-0.5 hover:bg-indigo-200"
                      aria-label={`Remove ${value}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
          ) : (
              <span className="text-sm text-gray-400 pl-1">{placeholder}</span>
          )}
          </div>
          
            {isLoading ? (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin ml-2"></div>
            ) : showSuccess ? (
            <svg className="w-4 h-4 text-green-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isEditable ? (
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            ) : null}
        </div>
      </div>

      {isOpen && ReactDOM.createPortal(
        <div
          data-dropdown-portal
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            minWidth: '200px'
          }}
        >
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
          
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option}-${index}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelect(option);
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
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
            {searchTerm.trim() && addOption && !filteredOptions.includes(searchTerm.trim()) && !selectedValues.includes(searchTerm.trim()) && (
              <div
                onClick={(event) => {
                  event.stopPropagation();
                  handleAddNew();
                }}
                onMouseDown={(event) => event.stopPropagation()}
                className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors flex items-center"
              >
                <Plus size={16} className="mr-2" /> {addNewLabel.replace('%s', searchTerm.trim())}
              </div>
            )}
            </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SupabaseMultiSelectSelector; 