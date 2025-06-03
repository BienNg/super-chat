import React, { useState, useEffect } from 'react';
import { X, Upload, Image, Edit3, Save } from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';

/**
 * AccountSettingsModal - Modal for editing account details and uploading avatar images
 * Follows the same design patterns as PaymentForm for consistency
 */
const AccountSettingsModal = ({ isOpen, onClose, account }) => {
  const { updateAccount } = useAccounts();
  
  const [formData, setFormData] = useState({
    name: '',
    avatarImage: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Reset form when modal opens or account changes
  useEffect(() => {
    if (isOpen && account) {
      setFormData({
        name: account.name || '',
        avatarImage: null
      });
      setErrors({});
      setImagePreview(account.avatarUrl || null);
    }
  }, [isOpen, account]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updates = {
        name: formData.name.trim()
      };

      // Handle avatar image upload if a new image was selected
      if (formData.avatarImage) {
        // TODO: Implement Firebase Storage upload
        // For now, we'll store the image as base64 (not recommended for production)
        const reader = new FileReader();
        reader.onload = async (e) => {
          updates.avatarUrl = e.target.result;
          await updateAccount(account.id, updates);
          onClose();
        };
        reader.readAsDataURL(formData.avatarImage);
      } else {
        await updateAccount(account.id, updates);
        onClose();
      }
    } catch (error) {
      console.error('Error updating account:', error);
      setErrors({ submit: 'Failed to update account. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    // Handle file size validation for avatar images
    if (field === 'avatarImage' && value) {
      const maxSize = 3 * 1024 * 1024; // 3MB in bytes
      if (value.size > maxSize) {
        setErrors(prev => ({ ...prev, avatarImage: 'File size must be less than 3MB' }));
        return;
      }
      // Clear any previous file size errors
      if (errors.avatarImage) {
        setErrors(prev => ({ ...prev, avatarImage: '' }));
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Handle image preview for avatar uploads
    if (field === 'avatarImage' && value) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(value);
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, avatarImage: null }));
    setImagePreview(account?.avatarUrl || null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !account) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Account Name and Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Edit3 className="inline h-4 w-4 mr-1" />
                Account Details
              </label>
              <div className="flex items-center space-x-4">
                {/* Avatar Upload */}
                <div className="flex-shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleInputChange('avatarImage', e.target.files[0])}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer block"
                    title="Click to upload avatar"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <Image className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </label>
                  {/* Error Message for Image Upload */}
                  {errors.avatarImage && (
                    <p className="mt-1 text-xs text-red-600">{errors.avatarImage}</p>
                  )}
                </div>

                {/* Account Name Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter account name..."
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Remove Avatar Button */}
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                    title="Remove avatar"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Error and Actions */}
        <div className="flex-shrink-0 border-t border-gray-200">
          {/* Submit Error */}
          {errors.submit && (
            <div className="px-6 pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsModal; 