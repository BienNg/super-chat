import React, { useState } from 'react';
import { X, Edit2, Trash2, Save, AlertTriangle } from 'lucide-react';

const OptionSettingsModal = ({ 
  isOpen, 
  onClose, 
  title, 
  options, 
  onUpdate, 
  onDelete 
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (option) => {
    setEditingId(option.id);
    setEditValue(option.value);
  };

  const handleSave = async () => {
    if (!editValue.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate(editingId, editValue.trim());
      setEditingId(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating option:', error);
      // You might want to show a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setIsSubmitting(true);
    try {
      await onDelete(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting option:', error);
      // You might want to show a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage {title}</h2>
              <p className="text-sm text-gray-500">Edit or delete existing options</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6">
            {options.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No {title.toLowerCase()} found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {editingId === option.id ? (
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter new value"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleSave}
                            disabled={isSubmitting || !editValue.trim()}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-900 font-medium">{option.value}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(option)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(option.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Option</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete "{options.find(o => o.id === deleteConfirm)?.value}"?
                </p>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionSettingsModal; 