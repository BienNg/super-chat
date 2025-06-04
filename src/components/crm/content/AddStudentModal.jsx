import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, GraduationCap, MessageSquare, AlertCircle } from 'lucide-react';
import CustomSelect from './CustomSelect';
import MultiSelect from './MultiSelect';
import OptionSettingsModal from './OptionSettingsModal';
import { useCategories } from '../../../hooks/useCategories';
import { usePlatforms } from '../../../hooks/usePlatforms';
import { useCountries } from '../../../hooks/useCountries';
import { useCities } from '../../../hooks/useCities';

const AddStudentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    city: '',
    categories: [],
    platform: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [settingsModal, setSettingsModal] = useState({ isOpen: false, type: '', title: '' });

  // Database hooks for dynamic options
  const { categories, categoriesWithIds, addCategory, updateCategory, deleteCategory } = useCategories();
  const { platforms, addPlatform } = usePlatforms();
  const { countries, addCountry } = useCountries();
  const { cities, addCity } = useCities();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleAddNewOption = async (optionType, newOption) => {
    if (!newOption.trim()) return;

    try {
      switch (optionType) {
        case 'categories':
          await addCategory(newOption);
          break;
        case 'platforms':
          await addPlatform(newOption);
          break;
        case 'countries':
          await addCountry(newOption);
          break;
        case 'cities':
          await addCity(newOption);
          break;
        default:
          console.warn('Unknown option type:', optionType);
      }
    } catch (error) {
      console.error('Error adding new option:', error);
      // You might want to show a toast notification here
    }
  };

  const handleOpenSettings = (type, title) => {
    setSettingsModal({ isOpen: true, type, title });
  };

  const handleCloseSettings = () => {
    setSettingsModal({ isOpen: false, type: '', title: '' });
  };

  const handleUpdateOption = async (id, newValue) => {
    try {
      switch (settingsModal.type) {
        case 'categories':
          await updateCategory(id, newValue);
          break;
        // Add other cases as needed
        default:
          console.warn('Unknown settings type:', settingsModal.type);
      }
    } catch (error) {
      console.error('Error updating option:', error);
      throw error;
    }
  };

  const handleDeleteOption = async (id) => {
    try {
      switch (settingsModal.type) {
        case 'categories':
          await deleteCategory(id);
          break;
        // Add other cases as needed
        default:
          console.warn('Unknown settings type:', settingsModal.type);
      }
    } catch (error) {
      console.error('Error deleting option:', error);
      throw error;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email and phone are now optional - only validate format if provided
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    // City and Platform are now optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(''); // Clear any previous submit errors
    
    try {
      // Generate avatar initials
      const nameParts = formData.name.trim().split(' ');
      const avatar = nameParts.length > 1 
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : formData.name.slice(0, 2).toUpperCase();

      // Generate random avatar color
      const avatarColors = ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#F97316', '#14B8A6'];
      const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

      const newStudent = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        location: formData.location,
        city: formData.city,
        categories: formData.categories,
        platform: formData.platform,
        notes: formData.notes.trim(),
        avatar,
        avatar_color: avatarColor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await onSubmit(newStudent);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        city: '',
        categories: [],
        platform: '',
        notes: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating student:', error);
      
      // Handle specific error cases
      if (error.message && error.message.toLowerCase().includes('email already exists')) {
        setErrors(prev => ({
          ...prev,
          email: 'This email address is already registered. Please use a different email.'
        }));
      } else if (error.message && error.message.toLowerCase().includes('email')) {
        setErrors(prev => ({
          ...prev,
          email: error.message
        }));
      } else {
        // Show general error message
        setSubmitError(error.message || 'Failed to create student. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
                <p className="text-sm text-gray-500">Create a new student profile with all details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-8">
              {/* Submit Error Message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{submitError}</p>
                    <p className="text-xs mt-1">Please try again or contact support if the issue persists.</p>
                  </div>
                </div>
              )}

              {/* Student Info */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Student Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1`}
                        placeholder="john.doe@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Category Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="categories" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenSettings('categories', 'Categories')}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Manage
                      </button>
                    </div>
                    <MultiSelect
                      value={formData.categories}
                      onChange={(val) => handleInputChange('categories', val)}
                      options={categories}
                      onAddNew={(val) => handleAddNewOption('categories', val)}
                      placeholder="Select categories"
                    />
                  </div>

                  {/* Country Field */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <CustomSelect
                      value={formData.location}
                      onChange={(val) => handleInputChange('location', val)}
                      options={countries}
                      onAddNew={(val) => handleAddNewOption('countries', val)}
                      allowAddNew={true}
                      hasError={!!errors.location}
                      placeholder="Select country"
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                    )}
                  </div>

                  {/* City Field */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <CustomSelect
                      value={formData.city}
                      onChange={(val) => handleInputChange('city', val)}
                      options={cities}
                      onAddNew={(val) => handleAddNewOption('cities', val)}
                      allowAddNew={true}
                      placeholder="Select city"
                    />
                  </div>

                  {/* Platform Field */}
                  <div>
                    <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                      Platform
                    </label>
                    <CustomSelect
                      value={formData.platform}
                      onChange={(val) => handleInputChange('platform', val)}
                      options={platforms}
                      onAddNew={(val) => handleAddNewOption('platforms', val)}
                      allowAddNew={true}
                      placeholder="Select platform"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Additional Notes</h3>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Add any additional notes about the student..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Option Settings Modal */}
      <OptionSettingsModal
        isOpen={settingsModal.isOpen}
        onClose={handleCloseSettings}
        title={settingsModal.title}
        options={settingsModal.type === 'categories' ? categoriesWithIds : []}
        onUpdate={handleUpdateOption}
        onDelete={handleDeleteOption}
      />
    </div>
  );
};

export default AddStudentModal; 