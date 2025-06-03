import React, { useState, useEffect, useRef } from 'react';
import { Search, Percent, Plus, X } from 'lucide-react';
import { useDiscounts } from '../../hooks/useDiscounts';

const PaymentDiscountSelector = ({ 
  onSelectDiscount, 
  selectedDiscountIds = [],
  className, 
  disabled = false,
  error = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { discounts, loading, error: discountsError, addDiscount } = useDiscounts();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Find the selected discounts for display
  const selectedDiscounts = selectedDiscountIds.map(id => 
    discounts.find(discount => discount.id === id)
  ).filter(Boolean);

  // Filter discounts based on search term and exclude already selected ones
  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = !searchTerm || 
                         discount.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discount.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const notSelected = !selectedDiscountIds.includes(discount.id);
    
    return matchesSearch && notSelected;
  });

  // Check if search term matches any existing discount
  const hasExactMatch = discounts.some(discount => 
    discount.name?.toLowerCase() === searchTerm.toLowerCase()
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

  const handleSelectDiscount = (discount) => {
    // Add the discount to the selected list
    const newSelectedIds = [...selectedDiscountIds, discount.id];
    onSelectDiscount(newSelectedIds);
    
    // Clear the search term but keep dropdown open for multiple selections
    setSearchTerm('');
  };

  const handleRemoveDiscount = (discountId) => {
    // Remove the discount from the selected list
    const newSelectedIds = selectedDiscountIds.filter(id => id !== discountId);
    onSelectDiscount(newSelectedIds);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClearAll = () => {
    onSelectDiscount([]);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAddNewDiscount = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const newDiscount = await addDiscount({
        name: searchTerm.trim(),
        type: 'percentage',
        value: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Add the newly created discount to selection
      handleSelectDiscount(newDiscount);
    } catch (error) {
      console.error('Error adding new discount:', error);
    }
  };

  const getDisplayName = (discount) => {
    return discount.name || 'Unnamed Discount';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Percent className="inline h-4 w-4 mr-1" />
        Discount (Optional)
      </label>
      
      {/* Input Field with Selected Discounts as Tags */}
      <div 
        className={`w-full min-h-[42px] px-3 py-2 border rounded-lg cursor-text transition-colors ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'} ${
          isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
        }`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <div className="flex flex-wrap items-center gap-1">
          {/* Selected Discount Tags */}
          {selectedDiscounts.map((discount) => (
            <span
              key={discount.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-md"
            >
              {getDisplayName(discount)}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveDiscount(discount.id);
                }}
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          
          {/* Search Input */}
          <div className="flex-1 min-w-[120px] relative">
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              disabled={disabled}
              className="w-full pl-6 pr-2 py-1 border-0 focus:ring-0 focus:outline-none text-sm bg-transparent"
              placeholder={selectedDiscounts.length === 0 ? "Search for discounts..." : "Add more..."}
            />
          </div>
          
          {/* Clear All Button */}
          {selectedDiscounts.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Clear all discounts"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mx-auto"></div>
              <span className="mt-2 block">Loading discounts...</span>
            </div>
          ) : discountsError ? (
            <div className="px-4 py-3 text-sm text-red-600 text-center">
              Error loading discounts: {discountsError}
            </div>
          ) : (
            <div className="py-1">
              {filteredDiscounts.map((discount) => {
                return (
                  <button
                    key={discount.id}
                    onClick={() => handleSelectDiscount(discount)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {getDisplayName(discount)}
                      </p>
                    </div>
                  </button>
                );
              })}
              
              {/* Add new discount option */}
              {searchTerm && !hasExactMatch && (
                <button
                  onClick={handleAddNewDiscount}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-t border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900">
                        Add "{searchTerm}"
                      </p>
                      <p className="text-xs text-blue-600">
                        Create new discount
                      </p>
                    </div>
                  </div>
                </button>
              )}
              
              {filteredDiscounts.length === 0 && !searchTerm && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {selectedDiscounts.length > 0 ? 'All available discounts selected' : 'No discounts available'}
                </div>
              )}
              
              {filteredDiscounts.length === 0 && searchTerm && hasExactMatch && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No additional discounts found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentDiscountSelector; 