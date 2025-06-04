import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, GraduationCap, MessageSquare, AlertCircle } from 'lucide-react';
import CustomSelect from './CustomSelect';
import MultiSelect from './MultiSelect';
import OptionSettingsModal from './OptionSettingsModal';
import { useFunnelSteps } from '../../../hooks/useFunnelSteps';
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
    platform: [],
    courses: [],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [settingsModal, setSettingsModal] = useState({ isOpen: false, type: '', title: '' });

  // Database hooks for dynamic options
  const { funnelSteps: categories, funnelStepsWithIds: categoriesWithIds, addFunnelStep: addCategory, updateFunnelStep: updateCategory, deleteFunnelStep: deleteCategory } = useFunnelSteps();
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
        case 'funnelSteps':
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
        platform: formData.platform.join(', '),
        courses: [],
        notes: formData.notes.trim(),
        avatar,
        avatarColor
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
        platform: [],
        courses: [],
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
                <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{submitError}</span>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter student's full name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="student@example.com"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="+84 901 234 567"
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <MultiSelect
                      label="Category"
                      value={formData.categories}
                      onChange={(value) => handleInputChange('categories', value)}
                      options={categories}
                      placeholder="Select categories"
                      allowAddNew={true}
                      onAddNew={(newOption) => handleAddNewOption('funnelSteps', newOption)}
                      addNewLabel="New Category..."
                      onOpenSettings={() => handleOpenSettings('categories', 'Categories')}
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">Location</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <CustomSelect
                      label="Country"
                      value={formData.location}
                      onChange={(value) => handleInputChange('location', value)}
                      options={countries}
                      placeholder="Select country"
                      required={true}
                      error={errors.location}
                      allowAddNew={true}
                      onAddNew={(newOption) => handleAddNewOption('countries', newOption)}
                      addNewLabel="New Country..."
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="City"
                      value={formData.city}
                      onChange={(value) => handleInputChange('city', value)}
                      options={cities}
                      placeholder="Select city"
                      allowAddNew={true}
                      onAddNew={(newOption) => handleAddNewOption('cities', newOption)}
                      addNewLabel="New City..."
                    />
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">Course Information</h3>
                </div>
                
                <div>
                  <MultiSelect
                    label="Platform"
                    value={formData.platform}
                    onChange={(value) => handleInputChange('platform', value)}
                    options={platforms}
                    placeholder="Search and select platforms..."
                    allowAddNew={true}
                    onAddNew={(newOption) => handleAddNewOption('platforms', newOption)}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="Add any additional notes about the student..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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