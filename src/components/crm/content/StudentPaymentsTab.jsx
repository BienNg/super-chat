import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, FileText, MoreVertical, User } from 'lucide-react';
import { usePayments } from '../../../hooks/usePayments';
import { useAccounts } from '../../../hooks/useAccounts';

const StudentPaymentsTab = ({ student }) => {
  const [studentPayments, setStudentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getPaymentsByStudent } = usePayments();
  const { accounts } = useAccounts();

  // Load student payments when component mounts or student changes
  useEffect(() => {
    const loadPayments = async () => {
      if (!student?.id && !student?.studentId) {
        setStudentPayments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Try both student.id and student.studentId as the payment might reference either
        const studentId = student.id || student.studentId;
        const payments = await getPaymentsByStudent(studentId);
        setStudentPayments(payments);
      } catch (error) {
        console.error('Error loading student payments:', error);
        setStudentPayments([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [student?.id, student?.studentId, getPaymentsByStudent]);

  // Format currency (matching your VND format from screenshot)
  const formatCurrency = (amount, currency = 'VND') => {
    if (!amount) return '0 ' + currency;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount).replace('₫', currency);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get account by payment method or account ID
  const getAccountForPayment = (payment) => {
    if (!accounts || accounts.length === 0) return null;
    
    // Try to find by paymentAccountId first
    if (payment.paymentAccountId) {
      const account = accounts.find(acc => acc.id === payment.paymentAccountId);
      if (account) return account;
    }
    
    // Fall back to matching by payment method type
    if (payment.paymentMethod) {
      const account = accounts.find(acc => acc.type === payment.paymentMethod);
      if (account) return account;
    }
    
    // Default to first account or null
    return accounts[0] || null;
  };
  
  // Generate account icon display
  const renderAccountIcon = (payment) => {
    const account = getAccountForPayment(payment);
    
    if (!account) {
      return (
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-indigo-600" />
        </div>
      );
    }
    
    // Generate consistent account icon color based on type
    const getAccountIconColor = (type) => {
      const typeColors = {
        'bank_transfer': { background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
        'cash': { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
        'credit_card': { background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' },
        'paypal': { background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' },
        'other': { background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' },
        'payment_method': { background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' }
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
    
    return (
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ 
          background: account.avatarUrl ? '#ffffff' : getAccountIconColor(account.type).background,
          border: account.avatarUrl ? '1px solid #e5e7eb' : 'none'
        }}
      >
        {account.avatarUrl ? (
          <img
            src={account.avatarUrl}
            alt={account.name || 'Account'}
            className="w-8 h-8 rounded-lg object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-white">
            {getAccountInitials(account)}
          </span>
        )}
      </div>
    );
  };

  // Calculate totals
  const totalPaid = studentPayments
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 p-1 h-full">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-500">Payment History</h3>
          <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors">
            Record Payment
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center text-center h-[340px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-sm text-gray-500">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-500">Payment History</h3>
        <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors">
          Record Payment
        </button>
      </div>
      
      {studentPayments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center text-center h-[340px]">
          <CreditCard className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-500">No payment records found</p>
          <p className="text-xs text-gray-400 mt-2 max-w-sm">Record a payment to track this student's financial history</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-green-600">Total Amount</p>
                  <p className="text-lg font-semibold text-green-700">
                    {formatCurrency(totalPaid, studentPayments[0]?.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment List */}
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {studentPayments.map((payment) => (
              <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {renderAccountIcon(payment)}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {payment.paymentType || 'Payment'} • {payment.paymentMethod || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span>Date: {formatDate(payment.paymentDate || payment.createdAt)}</span>
                        {payment.courseName && <span>Course: {payment.courseName}</span>}
                      </div>
                      {payment.notes && (
                        <div className="flex items-start space-x-1">
                          <FileText className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="italic">{payment.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-1 rounded-full hover:bg-gray-100">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPaymentsTab; 