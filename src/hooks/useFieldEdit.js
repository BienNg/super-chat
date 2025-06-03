import { useState, useCallback } from 'react';

/**
 * Hook for managing editable fields with auto-save functionality
 * 
 * @param {Function} updateFunction - Function to call when saving the field
 * @param {Object} options - Additional options
 * @returns {Object} - Field editing state and handlers
 */
export function useFieldEdit(updateFunction, options = {}) {
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEditStart = useCallback((field, value) => {
    setEditField(field);
    setEditValue(value || '');
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditField(null);
    setEditValue('');
  }, []);

  const handleEditSave = useCallback(async (recordId, additionalUpdates = {}) => {
    if (!editField) return;
    
    try {
      setIsLoading(true);
      
      const updates = {
        [editField]: editValue,
        ...additionalUpdates
      };
      
      // Special handling for name field, update avatar text
      if (editField === 'name') {
        const avatarText = editValue
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        updates.avatar = avatarText;
      }
      
      await updateFunction(recordId, updates);
      setEditField(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating field:', error);
    } finally {
      setIsLoading(false);
    }
  }, [editField, editValue, updateFunction]);

  return {
    editField,
    editValue,
    isLoading,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
    setEditValue
  };
} 