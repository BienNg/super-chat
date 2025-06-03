import React, { useEffect, useState } from 'react';
import { 
  X, 
  CreditCard, 
  Calendar, 
  FileText, 
  User, 
  GraduationCap, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Download,
  Edit,
  Receipt,
  Building,
  Percent,
  Trash2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import StudentDetailsModal from './StudentDetailsModal';

/**
 * PaymentDetailsModal - Notion-style side peek modal for payment details
 * Slides in from the right side with comprehensive payment information
 */
const PaymentDetailsModal = ({ 
  isOpen, 
  onClose, 
  payment, 
  currency = 'EUR',
  onEdit = null,
  onDelete = null,
  onOpenStudentDetails = null,
  onOpenCourseDetails = null 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Don't prevent body scroll - allow interaction with background
    } else {
      // No need to manage body scroll since we're not preventing it
    }

    // No cleanup needed for body scroll
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match the animation duration
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Add handlers for opening student and course details
  const handleStudentClick = () => {
    if (!payment?.studentId) return;
    
    // Create an enrollment-like object for the StudentDetailsModal
    const enrollmentData = {
      studentId: payment.studentId,
      studentName: payment.studentName,
      studentEmail: payment.studentEmail,
      studentPhone: payment.studentPhone
    };
    
    if (onOpenStudentDetails) {
      // If parent component provides a handler, use it
      onOpenStudentDetails(enrollmentData);
    } else {
      // Otherwise, open our own modal
      setSelectedEnrollment(enrollmentData);
      setShowStudentModal(true);
    }
  };

  const handleCourseClick = () => {
    if (!payment?.courseId) return;
    
    // Create a course object
    const courseData = {
      id: payment.courseId,
      courseName: payment.courseName,
      level: payment.courseLevel,
      // Add other course properties as needed
    };
    
    if (onOpenCourseDetails) {
      // If parent component provides a handler, use it
      onOpenCourseDetails(courseData);
    } else {
      // For now, just log this - you could implement a course details modal
      console.log('Opening course details for:', courseData);
      // Could show a simple alert or toast notification
      alert(`Course: ${courseData.courseName}\nLevel: ${courseData.level || 'Not specified'}`);
    }
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedEnrollment(null);
  };

  const formatCurrency = (amount, curr = currency) => {
    const formatters = {
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      'VND': new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    };
    
    return formatters[curr]?.format(amount) || `${curr} ${amount?.toLocaleString() || 0}`;
  };

  // Status icon function removed

  // Status badge function removed

  const getUserInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
    ];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  const handleDownloadReceipt = () => {
    console.log('Download receipt for payment:', payment?.id);
    // In a real app, this would trigger receipt download
  };

  const handleEditPayment = () => {
    if (onEdit) {
      onEdit(payment);
    }
  };

  const handleDeletePayment = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete && payment) {
      // Call the onDelete function with just the payment object
      onDelete(payment);
      setShowDeleteConfirm(false);
      // Don't close the modal here - let the parent handle it
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (!isOpen || !payment) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Backdrop - clickable to close but doesn't block background */}
        <div 
          className={`fixed inset-0 transition-opacity duration-300 pointer-events-auto ${
            isAnimating ? 'bg-black bg-opacity-20' : 'bg-transparent'
          }`}
          onClick={handleBackdropClick}
        />
        
        {/* Modal Panel - positioned to not block background */}
        <div className="fixed inset-y-0 right-0 flex justify-end pointer-events-none">
          <div 
            className={`w-full max-w-4xl transform transition-transform duration-300 ease-out pointer-events-auto ${
              isAnimating ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex h-full flex-col bg-white shadow-2xl border-l border-gray-200">
              {/* Header */}
              <div className="bg-indigo-50 px-6 py-6 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-600 rounded-xl">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                      <p className="text-sm text-gray-600 mt-1">Transaction ID: #{payment.id?.slice(-8) || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {onEdit && (
                      <button
                        onClick={handleEditPayment}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all duration-200"
                        title="Edit Payment"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={handleDownloadReceipt}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all duration-200"
                      title="Download Receipt"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={handleDeletePayment}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 hover:bg-opacity-50 rounded-lg transition-all duration-200"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all duration-200"
                      title="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-8 space-y-8">
                  
                  {/* Payment Amount & Date - Full Width */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <DollarSign className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Payment Amount</h3>
                          <p className="text-sm text-gray-600">Total transaction value</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">Payment Date</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </span>
                      {payment.originalCurrency !== currency && (
                        <span className="text-lg text-gray-500">
                          ({formatCurrency(payment.originalAmount, payment.originalCurrency)})
                        </span>
                      )}
                    </div>
                    {/* Payment method removed */}
                  </div>

                  {/* Two Column Layout for Main Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
                      {/* Student Information */}
                      <div 
                        className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
                        onClick={handleStudentClick}
                      >
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">Student Information</h3>
                          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold ${getAvatarColor(payment.studentName)}`}>
                            {getUserInitials(payment.studentName)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">{payment.studentName}</h4>
                            <p className="text-sm text-gray-600 mt-1">{payment.studentEmail}</p>
                            {payment.studentPhone && (
                              <p className="text-sm text-gray-600">{payment.studentPhone}</p>
                            )}
                            <p className="text-xs text-indigo-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Click to view student details →
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                      {/* Course Information */}
                      <div 
                        className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all duration-200 group"
                        onClick={handleCourseClick}
                      >
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors duration-200">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">Course Details</h3>
                          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Course Name</label>
                            <p className="text-base text-gray-900 mt-1 group-hover:text-purple-700 transition-colors duration-200">{payment.courseName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Payment Type</label>
                            <p className="text-base text-gray-900 mt-1 capitalize">
                              {payment.paymentType?.replace('_', ' ') || 'Full Payment'}
                            </p>
                          </div>
                          <p className="text-xs text-purple-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            Click to view course details →
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full Width Content */}
                  {/* Notes */}
                  {payment.notes && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{payment.notes}</p>
                    </div>
                  )}

                  {/* Receipt Image */}
                  {payment.receiptImage && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Receipt className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Receipt</h3>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={payment.receiptImage} 
                          alt="Payment Receipt"
                          className="w-full h-auto max-w-md mx-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Rendered at root level */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Payment</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the payment of{' '}
                <span className="font-semibold">
                  {formatCurrency(payment?.amount)}
                </span>{' '}
                from <span className="font-semibold">{payment?.studentName}</span>?
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      <StudentDetailsModal
        enrollment={selectedEnrollment}
        isOpen={showStudentModal}
        onClose={handleCloseStudentModal}
      />
    </>
  );
};

export default PaymentDetailsModal; 