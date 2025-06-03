import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Upload, Image } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { useCourses } from '../../hooks/useCourses';
import { useAccounts } from '../../hooks/useAccounts';
import { useDiscounts } from '../../hooks/useDiscounts';
import PaymentStudentSelector from './PaymentStudentSelector';
import PaymentCourseSelector from './PaymentCourseSelector';
import PaymentDropdownSelector from './PaymentDropdownSelector';
import PaymentAccountSelector from './PaymentAccountSelector';
import PaymentDiscountSelector from './PaymentDiscountSelector';

/**
 * PaymentForm - Modal form for recording new payments
 * Integrates with student and course data for payment tracking
 */
const PaymentForm = ({ isOpen, onClose, onSubmit, currency = 'EUR' }) => {
  const { students, loading: studentsLoading } = useStudents();
  const { courses, loading: coursesLoading } = useCourses();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { discounts, loading: discountsLoading } = useDiscounts();
  
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    amount: '',
    currency: currency,
    discountIds: [],
    paymentType: 'full_payment',
    paymentAccountId: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
    receiptImage: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        studentId: '',
        courseId: '',
        amount: '',
        currency: currency,
        discountIds: [],
        paymentType: 'full_payment',
        paymentAccountId: '',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0],
        receiptImage: null
      });
      setErrors({});
      setImagePreview(null);
    }
  }, [isOpen, currency]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentId) {
      newErrors.studentId = 'Please select a student';
    }

    if (!formData.courseId) {
      newErrors.courseId = 'Please select a course';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Please select a payment date';
    }

    if (!formData.paymentAccountId) {
      newErrors.paymentAccountId = 'Please select an account';
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
      // Get student, course, account, and discount details
      const selectedStudent = students.find(s => s.id === formData.studentId);
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      const selectedAccount = accounts.find(a => a.id === formData.paymentAccountId);
      const selectedDiscounts = formData.discountIds.map(id => discounts.find(d => d.id === id));

      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        studentName: selectedStudent?.fullName || 'Unknown Student',
        studentEmail: selectedStudent?.email || '',
        courseName: selectedCourse?.courseName || selectedCourse?.name || 'Unknown Course',
        accountName: selectedAccount?.name || 'Unknown Account',
        accountType: selectedAccount?.type || 'unknown',
        discountNames: selectedDiscounts.map(d => d?.name || null),
        discountTypes: selectedDiscounts.map(d => d?.type || null),
        discountValues: selectedDiscounts.map(d => d?.value || null),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSubmit(paymentData);
    } catch (error) {
      console.error('Error submitting payment:', error);
      setErrors({ submit: 'Failed to record payment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    // Handle file size validation for receipt images
    if (field === 'receiptImage' && value) {
      const maxSize = 3 * 1024 * 1024; // 3MB in bytes
      if (value.size > maxSize) {
        setErrors(prev => ({ ...prev, receiptImage: 'File size must be less than 3MB' }));
        return;
      }
      // Clear any previous file size errors
      if (errors.receiptImage) {
        setErrors(prev => ({ ...prev, receiptImage: '' }));
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Handle image preview for receipt uploads
    if (field === 'receiptImage' && value) {
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleInputChange('receiptImage', file);
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, receiptImage: null }));
    setImagePreview(null);
  };

  const formatAmount = (value) => {
    if (!value) return '';
    
    // Remove all non-digit characters except decimal point
    const cleanValue = value.toString().replace(/[^\d.,]/g, '');
    
    // Split by comma (decimal separator)
    const parts = cleanValue.split(',');
    const integerPart = parts[0] || '';
    const decimalPart = parts[1] || '';
    
    // Format integer part with dots as thousand separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Limit decimal part to 2 digits
    const limitedDecimal = decimalPart.slice(0, 2);
    
    // Combine parts
    if (limitedDecimal) {
      return `${formattedInteger},${limitedDecimal}`;
    }
    return formattedInteger;
  };

  const parseAmount = (formattedValue) => {
    if (!formattedValue) return '';
    
    // Remove dots (thousand separators) and replace comma with dot for decimal
    return formattedValue.replace(/\./g, '').replace(',', '.');
  };

  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    const numericValue = parseAmount(inputValue);
    
    // Validate that it's a valid number
    if (inputValue === '' || !isNaN(parseFloat(numericValue))) {
      setFormData(prev => ({ ...prev, amount: numericValue }));
    }
    
    // Clear error when user starts typing
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
            <p className="text-sm text-gray-500 mt-1">Add a new payment record to the system</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            {/* Section 1: Student & Course */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-bold text-sm">1</span>
                </div>
                Student & Course Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PaymentStudentSelector
                  onSelectStudent={(student) => {
                    if (student) {
                      handleInputChange('studentId', student.id);
                    } else {
                      handleInputChange('studentId', '');
                    }
                  }}
                  selectedStudentId={formData.studentId}
                  disabled={studentsLoading}
                  error={errors.studentId}
                />

                <PaymentCourseSelector
                  onSelectCourse={(course) => {
                    if (course) {
                      handleInputChange('courseId', course.id);
                    } else {
                      handleInputChange('courseId', '');
                    }
                  }}
                  selectedCourseId={formData.courseId}
                  disabled={coursesLoading}
                  error={errors.courseId}
                />
              </div>
            </div>

            {/* Section 2: Payment Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-bold text-sm">2</span>
                </div>
                Payment Details
              </h3>
              
              {/* Amount, Discount, Payment Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatAmount(formData.amount)}
                      onChange={handleAmountChange}
                      className={`w-full pl-3 pr-16 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      placeholder="0,00"
                    />
                    {/* Currency Selector */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <div className="relative">
                        <select
                          value={formData.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer pr-8 pl-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
                        >
                          <option value="VND">VND</option>
                          <option value="EUR">EUR</option>
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  {errors.amount && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.amount}
                    </p>
                  )}
                </div>

                <PaymentDiscountSelector
                  onSelectDiscount={(discountIds) => {
                    handleInputChange('discountIds', discountIds);
                  }}
                  selectedDiscountIds={formData.discountIds}
                  disabled={discountsLoading}
                  error={errors.discountIds}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      errors.paymentDate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {errors.paymentDate && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.paymentDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Type and Account Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PaymentDropdownSelector
                  label="Payment Type"
                  icon={FileText}
                  options={[
                    { value: 'full_payment', label: 'Full Payment', description: 'Complete course payment' },
                    { value: 'partial_payment', label: 'Partial Payment', description: 'Partial course payment' },
                    { value: 'deposit', label: 'Deposit', description: 'Initial deposit' }
                  ]}
                  value={formData.paymentType}
                  onChange={(value) => handleInputChange('paymentType', value)}
                  placeholder="Select payment type..."
                />

                <PaymentAccountSelector
                  onSelectAccount={(account) => {
                    if (account) {
                      handleInputChange('paymentAccountId', account.id);
                    } else {
                      handleInputChange('paymentAccountId', '');
                    }
                  }}
                  selectedAccountId={formData.paymentAccountId}
                  disabled={accountsLoading}
                  error={errors.paymentAccountId}
                />
              </div>
            </div>

            {/* Section 3: Additional Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-bold text-sm">3</span>
                </div>
                Additional Information
                <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none hover:border-gray-300 transition-all"
                    placeholder="Add any additional notes about this payment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Image className="inline h-4 w-4 mr-1" />
                    Receipt Image
                  </label>
                  
                  {imagePreview ? (
                    // Image Preview
                    <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <img
                            src={imagePreview}
                            alt="Receipt preview"
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formData.receiptImage?.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.receiptImage?.size ? `${(formData.receiptImage.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="mt-3 text-xs text-red-600 hover:text-red-800 font-medium transition-colors bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                          >
                            Remove image
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Upload Area
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleInputChange('receiptImage', e.target.files[0])}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label
                        htmlFor="receipt-upload"
                        className="cursor-pointer flex flex-col items-center space-y-3"
                      >
                        <div className="w-12 h-12 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center transition-colors">
                          <Upload className="h-6 w-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                            Drop image here or click to upload
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG up to 3MB
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                  
                  {/* Error Message for Image Upload */}
                  {errors.receiptImage && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.receiptImage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Error and Actions */}
        <div className="border-t border-gray-100 bg-gray-50 px-8 py-6">
          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                <span className="text-red-500 mr-2">⚠</span>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              All required fields must be completed
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-8 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Recording...</span>
                  </div>
                ) : (
                  'Record Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm; 