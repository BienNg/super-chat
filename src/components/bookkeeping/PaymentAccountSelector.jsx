import React, { useState, useEffect, useRef } from 'react';
import { Search, CreditCard, Plus, MoreHorizontal } from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import AccountSettingsModal from './AccountSettingsModal';

const PaymentAccountSelector = ({ 
  onSelectAccount, 
  selectedAccountId,
  className, 
  disabled = false,
  error = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedAccountForSettings, setSelectedAccountForSettings] = useState(null);
  const { accounts, loading, error: accountsError, addAccount } = useAccounts();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Find the selected account for display
  const selectedAccount = selectedAccountId ? 
    accounts.find(account => account.id === selectedAccountId) : null;

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm || 
                         account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Check if search term matches any existing account
  const hasExactMatch = accounts.some(account => 
    account.name?.toLowerCase() === searchTerm.toLowerCase()
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

  const handleSelectAccount = (account) => {
    // Clear the input field and close dropdown
    setSearchTerm('');
    setIsOpen(false);
    
    // Call the parent callback with the account data
    onSelectAccount(account);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClearSelection = () => {
    onSelectAccount(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAddNewAccount = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const newAccount = await addAccount({
        name: searchTerm.trim(),
        type: 'payment_method',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Select the newly created account
      handleSelectAccount(newAccount);
    } catch (error) {
      console.error('Error adding new account:', error);
    }
  };

  const handleOpenSettings = (account, e) => {
    e.stopPropagation(); // Prevent account selection
    setSelectedAccountForSettings(account);
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
    setSelectedAccountForSettings(null);
  };

  // Generate consistent account icon color based on type
  const getAccountIconColor = (type) => {
    const typeColors = {
      'bank_transfer': { background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }, // blue
      'cash': { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }, // green
      'credit_card': { background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }, // purple
      'paypal': { background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }, // orange
      'other': { background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }, // gray
      'payment_method': { background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' } // pink
    };
    
    return typeColors[type] || typeColors['payment_method'];
  };

  const getAccountInitials = (account) => {
    const name = account.name || '';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      return words[0].slice(0, 2).toUpperCase();
    } else if (words[0]) {
      return (words[0][0] + 'A').toUpperCase();
    }
    return 'AC';
  };

  const getDisplayName = (account) => {
    return account.name || 'Unnamed Account';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <CreditCard className="inline h-4 w-4 mr-1" />
        Account
      </label>
      
      {/* Selected Account Display or Input Field */}
      {selectedAccount && !isOpen ? (
        <div 
          onClick={() => setIsOpen(true)}
          className={`w-full px-3 py-2 border rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        >
          <div className="flex items-center space-x-3">
            {/* Account Icon */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ 
                background: selectedAccount.avatarUrl ? '#ffffff' : getAccountIconColor(selectedAccount.type).background,
                border: selectedAccount.avatarUrl ? '1px solid #e5e7eb' : 'none'
              }}
            >
              {selectedAccount.avatarUrl ? (
                <img
                  src={selectedAccount.avatarUrl}
                  alt={getDisplayName(selectedAccount)}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-white">
                  {getAccountInitials(selectedAccount)}
                </span>
              )}
            </div>
            
            {/* Account Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getDisplayName(selectedAccount)}
              </p>
            </div>
            
            {/* Clear button */}
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
            disabled={disabled}
            className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors ${
              error ? 'border-red-300' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`}
            placeholder={selectedAccount ? "Search to change account..." : "Search for an account..."}
          />
        </div>
      )}

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
              <span className="mt-2 block">Loading accounts...</span>
            </div>
          ) : accountsError ? (
            <div className="px-4 py-3 text-sm text-red-600 text-center">
              Error loading accounts: {accountsError}
            </div>
          ) : (
            <div className="py-1">
              {filteredAccounts.map((account) => {
                const iconColor = getAccountIconColor(account.type);
                const isSelected = selectedAccountId === account.id;
                
                return (
                  <button
                    key={account.id}
                    onClick={() => handleSelectAccount(account)}
                    className={`group w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                      isSelected ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Account Icon */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ 
                          background: account.avatarUrl ? '#ffffff' : iconColor.background,
                          border: account.avatarUrl ? '1px solid #e5e7eb' : 'none'
                        }}
                      >
                        {account.avatarUrl ? (
                          <img
                            src={account.avatarUrl}
                            alt={getDisplayName(account)}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {getAccountInitials(account)}
                          </span>
                        )}
                      </div>
                      
                      {/* Account Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isSelected ? 'text-indigo-900' : 'text-gray-900'
                        }`}>
                          {getDisplayName(account)}
                        </p>
                      </div>

                      {/* Settings Button */}
                      <button
                        onClick={(e) => handleOpenSettings(account, e)}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                        title="Account settings"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </button>
                );
              })}
              
              {/* Add new account option */}
              {searchTerm && !hasExactMatch && (
                <button
                  onClick={handleAddNewAccount}
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
                        Create new account
                      </p>
                    </div>
                  </div>
                </button>
              )}
              
              {filteredAccounts.length === 0 && !searchTerm && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No accounts available
                </div>
              )}
              
              {filteredAccounts.length === 0 && searchTerm && hasExactMatch && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No accounts found matching your search
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettings}
        account={selectedAccountForSettings}
      />
    </div>
  );
};

export default PaymentAccountSelector; 