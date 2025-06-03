import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Upload, Image, CreditCard, DollarSign } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { useCourses } from '../../hooks/useCourses';
import { useAccounts } from '../../hooks/useAccounts';
import { useDiscounts } from '../../hooks/useDiscounts';
import PaymentStudentSelector from '../bookkeeping/PaymentStudentSelector';
import PaymentCourseSelector from '../bookkeeping/PaymentCourseSelector';
import PaymentDropdownSelector from '../bookkeeping/PaymentDropdownSelector';
import PaymentAccountSelector from '../bookkeeping/PaymentAccountSelector';
import PaymentDiscountSelector from '../bookkeeping/PaymentDiscountSelector';

/**
 * PaymentModal - Reusable modal for creating/editing payments
 * Can be pre-filled with enrollment data for student/course payments
 */
const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currency = 'VND',
  title = 'Record Payment',
  description = 'Add a new payment record to the system',
  // Pre-fill options for enrollment payments
  prefilledData = null, // { studentId, studentName, studentEmail, courseId, courseName, amount, etc. }
  readOnlyFields = [], // Array of field names that should be read-only
  submitButtonText = 'Record Payment'
}) => {
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

  // Reset form when modal opens or prefilledData changes
  useEffect(() => {
    if (isOpen) {
      const initialData = {
        studentId: prefilledData?.studentId || '',
        courseId: prefilledData?.courseId || '',
        amount: prefilledData?.amount || '',
        currency: prefilledData?.currency || currency,
        discountIds: prefilledData?.discountIds || [],
        paymentType: prefilledData?.paymentType || 'full_payment',
        paymentAccountId: prefilledData?.paymentAccountId || '',
        notes: prefilledData?.notes || '',
        paymentDate: prefilledData?.paymentDate || new Date().toISOString().split('T')[0],
        receiptImage: null
      };
      
      setFormData(initialData);
      setErrors({});
      setImagePreview(null);
    }
  }, [isOpen, currency, prefilledData]);

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
      const selectedStudent = students.find(s => s.id === formData.studentId) || 
        (prefilledData ? { name: prefilledData.studentName, email: prefilledData.studentEmail } : null);
      const selectedCourse = courses.find(c => c.id === formData.courseId) || 
        (prefilledData ? { courseName: prefilledData.courseName, name: prefilledData.courseName } : null);
      const selectedAccount = accounts.find(a => a.id === formData.paymentAccountId);
      const selectedDiscounts = formData.discountIds.map(id => discounts.find(d => d.id === id));

      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        studentName: selectedStudent?.name || prefilledData?.studentName || 'Unknown Student',
        studentEmail: selectedStudent?.email || prefilledData?.studentEmail || '',
        courseName: selectedCourse?.courseName || selectedCourse?.name || prefilledData?.courseName || 'Unknown Course',
        accountName: selectedAccount?.name || 'Unknown Account',
        accountType: selectedAccount?.type || 'unknown',
        discountNames: selectedDiscounts.map(d => d?.name || null),
        discountTypes: selectedDiscounts.map(d => d?.type || null),
        discountValues: selectedDiscounts.map(d => d?.value || null),
        // Include any additional data from prefilledData
        ...(prefilledData?.additionalData || {}),
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
    // Skip if field is read-only
    if (readOnlyFields.includes(field)) return;
    
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

  const isFieldReadOnly = (field) => readOnlyFields.includes(field);

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
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <CreditCard className="w-7 h-7 text-indigo-600 mr-3" />
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
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
                    if (student && !isFieldReadOnly('studentId')) {
                      handleInputChange('studentId', student.id);
                    } else if (!isFieldReadOnly('studentId')) {
                      handleInputChange('studentId', '');
                    }
                  }}
                  selectedStudentId={formData.studentId}
                  disabled={studentsLoading || isFieldReadOnly('studentId')}
                  error={errors.studentId}
                  prefilledName={prefilledData?.studentName}
                  readOnly={isFieldReadOnly('studentId')}
                />

                <PaymentCourseSelector
                  onSelectCourse={(course) => {
                    if (course && !isFieldReadOnly('courseId')) {
                      handleInputChange('courseId', course.id);
                    } else if (!isFieldReadOnly('courseId')) {
                      handleInputChange('courseId', '');
                    }
                  }}
                  selectedCourseId={formData.courseId}
                  disabled={coursesLoading || isFieldReadOnly('courseId')}
                  error={errors.courseId}
                  prefilledName={prefilledData?.courseName}
                  readOnly={isFieldReadOnly('courseId')}
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
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatAmount(formData.amount)}
                      onChange={handleAmountChange}
                      disabled={isFieldReadOnly('amount')}
                      className={`w-full pl-3 pr-16 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      } ${isFieldReadOnly('amount') ? 'bg-gray-50 cursor-not-allowed' : ''} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      placeholder="0,00"
                    />
                    {/* Currency Selector */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <div className="relative">
                        <select
                          value={formData.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          disabled={isFieldReadOnly('currency')}
                          className={`appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer pr-8 pl-3 py-2 rounded-lg hover:bg-gray-100 transition-all ${
                            isFieldReadOnly('currency') ? 'cursor-not-allowed opacity-50' : ''
                          }`}
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
                    if (!isFieldReadOnly('discountIds')) {
                      handleInputChange('discountIds', discountIds);
                    }
                  }}
                  selectedDiscountIds={formData.discountIds}
                  disabled={discountsLoading || isFieldReadOnly('discountIds')}
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
                    disabled={isFieldReadOnly('paymentDate')}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      errors.paymentDate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    } ${isFieldReadOnly('paymentDate') ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  disabled={isFieldReadOnly('paymentType')}
                  error={errors.paymentType}
                />

                <PaymentAccountSelector
                  onSelectAccount={(account) => {
                    if (account && !isFieldReadOnly('paymentAccountId')) {
                      handleInputChange('paymentAccountId', account.id);
                    } else if (!isFieldReadOnly('paymentAccountId')) {
                      handleInputChange('paymentAccountId', '');
                    }
                  }}
                  selectedAccountId={formData.paymentAccountId}
                  disabled={accountsLoading || isFieldReadOnly('paymentAccountId')}
                  error={errors.paymentAccountId}
                />
              </div>
            </div>

            {/* Section 3: Additional Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-bold text-sm">3</span>
                </div>
                Additional Information
              </h3>
              
              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={isFieldReadOnly('notes')}
                  rows={3}
                  className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${
                    'border-gray-200 hover:border-gray-300'
                  } ${isFieldReadOnly('notes') ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Add any additional notes about this payment..."
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="inline h-4 w-4 mr-1" />
                  Receipt Image (Optional)
                </label>
                
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Receipt preview" 
                      className="w-full max-w-md h-48 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleInputChange('receiptImage', e.target.files[0])}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      <Image className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 3MB</p>
                    </label>
                  </div>
                )}
                
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

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 mr-2">⚠</span>
                {errors.submit}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>{submitButtonText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 