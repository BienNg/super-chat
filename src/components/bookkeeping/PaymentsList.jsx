import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePayments } from '../../hooks/usePayments';
import { Eye, Search, Filter, Trash2, AlertTriangle, Edit, MessageSquare } from 'lucide-react';
import PaymentDetailsModal from '../shared/PaymentDetailsModal';
import SendToChatModal from './SendToChatModal';
import { ActionsDropdown } from '../shared';

/**
 * PaymentsList - Displays recent payments in a table format
 * Shows student information, course details, payment amounts, and status
 */
const PaymentsList = ({ currency = 'EUR' }) => {
  const { payments, loading, deletePayment } = usePayments();
  const navigate = useNavigate();
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  // Status filter removed
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showSendToChatModal, setShowSendToChatModal] = useState(false);
  const [paymentToShare, setPaymentToShare] = useState(null);

  const formatCurrency = (amount, curr = currency) => {
    const formatters = {
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      'VND': new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    };
    
    return formatters[curr]?.format(amount) || `${curr} ${amount.toLocaleString()}`;
  };

  // Status badge function removed

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchQuery === '' || 
      // Student information
      payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Course information
      payment.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.paymentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Status field removed
      // Amount and currency
      payment.amount.toString().includes(searchQuery.toLowerCase()) ||
      payment.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatCurrency(payment.amount, payment.currency).toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Notes
      (payment.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Date
      new Date(payment.createdAt).toLocaleDateString().includes(searchQuery.toLowerCase()) ||
      new Date(payment.createdAt).toLocaleDateString('en-US').includes(searchQuery.toLowerCase()) ||
      new Date(payment.createdAt).toLocaleDateString('de-DE').includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Handle URL-based modal opening
  useEffect(() => {
    if (params.paymentId && payments.length > 0) {
      const payment = payments.find(p => p.id === params.paymentId);
      if (payment) {
        setSelectedPayment(payment);
        setIsModalOpen(true);
      }
    } else if (!params.paymentId) {
      setIsModalOpen(false);
      setSelectedPayment(null);
    }
  }, [params.paymentId, payments]);

  const handleViewReceipt = (paymentId) => {
    // Navigate to payment detail URL
    navigate(`/bookkeeping/payment/${paymentId}`);
  };

  const handleCloseModal = () => {
    // Navigate back to bookkeeping overview
    navigate('/bookkeeping');
  };

  const handleEditPayment = (payment) => {
    console.log('Edit payment:', payment);
    // In a real app, this would open an edit modal
    // For now, keep the modal open to maintain the URL state
  };

  const handleDeletePayment = (payment, e) => {
    e.stopPropagation(); // Prevent row click
    setConfirmDelete({
      id: payment.id,
      studentName: payment.studentName,
      amount: payment.amount,
      currency: payment.currency
    });
  };

  const handleDeleteFromModal = async (payment) => {
    // Direct deletion from the side peek modal (which has its own confirmation)
    try {
      setDeletingPaymentId(payment.id);
      await deletePayment(payment.id);
      console.log('Payment deleted successfully from modal');
      // Navigate back to overview after successful deletion
      navigate('/bookkeeping');
    } catch (error) {
      console.error('Error deleting payment from modal:', error);
      alert('Failed to delete payment. Please try again.');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      setDeletingPaymentId(confirmDelete.id);
      await deletePayment(confirmDelete.id);
      console.log('Payment deleted successfully');
      
      // If currently viewing the deleted payment details, navigate back to overview
      if (params.paymentId === confirmDelete.id) {
        navigate('/bookkeeping');
      }
      
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleRowClick = (paymentId) => {
    if (deletingPaymentId === paymentId) return; // Prevent clicks while deleting
    handleViewReceipt(paymentId);
  };

  const handleSendToChat = (payment) => {
    setPaymentToShare(payment);
    setShowSendToChatModal(true);
  };

  const handleCloseSendToChatModal = () => {
    setShowSendToChatModal(false);
    setPaymentToShare(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="p-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4 py-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Status Filter removed */}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              {/* Status column removed */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                  <div className="text-center max-w-md mx-auto">
                    {searchQuery ? (
                      // Filtered but no results
                      <>
                        <div className="mb-4">
                          <Search className="h-12 w-12 text-gray-300 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No payments match your filters</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Try adjusting your search terms or filter criteria to find payments.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                          }}
                          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                        >
                          Clear search
                        </button>
                      </>
                    ) : (
                      // No payments at all
                      <>
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" 
                              />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No payment records yet</h3>
                        <p className="text-sm text-gray-500 mb-6">
                          Start tracking your financial transactions by recording your first payment. 
                          All student payments, course fees, and transaction history will appear here.
                        </p>
                        <div className="text-xs text-gray-400 space-y-1">
                          <p>💡 <strong>Tip:</strong> Use the "Record Payment" button above to add your first transaction</p>
                          <p>📊 Once you have payments, you'll see financial stats and trends</p>
                          <p>🔍 Use search and filters to quickly find specific transactions</p>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr 
                  key={payment.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => handleRowClick(payment.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(payment.studentName)}`}>
                        {getUserInitials(payment.studentName)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                        <div className="text-sm text-gray-500">{payment.studentEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.courseName}</div>
                    <div className="text-sm text-gray-500">{payment.paymentType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    {payment.originalCurrency && payment.originalCurrency !== payment.currency && (
                      <div className="text-sm text-gray-500">
                        {formatCurrency(payment.originalAmount, payment.originalCurrency)}
                      </div>
                    )}
                  </td>
                  {/* Status cell removed */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate" title={payment.notes || ''}>
                      {payment.notes || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ActionsDropdown
                      itemId={payment.id}
                      item={payment}
                      disabled={deletingPaymentId === payment.id}
                      actions={[
                        {
                          key: 'view',
                          label: 'View Details',
                          icon: Eye,
                          onClick: (payment) => handleViewReceipt(payment.id),
                          disabled: deletingPaymentId === payment.id
                        },
                        {
                          key: 'edit',
                          label: 'Edit Payment',
                          icon: Edit,
                          onClick: (payment) => handleEditPayment(payment),
                          disabled: deletingPaymentId === payment.id
                        },
                        {
                          key: 'sendToChat',
                          label: 'Send to Chat',
                          icon: MessageSquare,
                          onClick: (payment) => handleSendToChat(payment),
                          disabled: deletingPaymentId === payment.id
                        },
                        {
                          key: 'delete',
                          label: 'Delete Payment',
                          icon: Trash2,
                          onClick: (payment, e) => handleDeletePayment(payment, e),
                          disabled: deletingPaymentId === payment.id,
                          loading: deletingPaymentId === payment.id,
                          loadingLabel: 'Deleting...',
                          isDanger: true,
                          separator: true
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        payment={selectedPayment}
        currency={currency}
        onEdit={handleEditPayment}
        onDelete={handleDeleteFromModal}
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
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
                  {new Intl.NumberFormat('de-DE', { 
                    style: 'currency', 
                    currency: confirmDelete.currency 
                  }).format(confirmDelete.amount)}
                </span>{' '}
                from <span className="font-semibold">{confirmDelete.studentName}</span>?
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deletingPaymentId}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={deletingPaymentId}
              >
                {deletingPaymentId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send to Chat Modal */}
      {showSendToChatModal && (
        <SendToChatModal
          isOpen={showSendToChatModal}
          onClose={handleCloseSendToChatModal}
          payment={paymentToShare}
        />
      )}
    </div>
  );
};

export default PaymentsList; 