import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePayments } from '../../hooks/usePayments';
import { BookkeepingLayout } from './layout';
import FinancialOverview from './FinancialOverview';
import PaymentModal from '../shared/PaymentModal';
import PaymentSuccessToast from '../shared/PaymentSuccessToast';
import PaymentsList from './PaymentsList';
import RevenueChart from './RevenueChart';
import InterfaceWrapper from '../shared/InterfaceWrapper';
import { Plus } from 'lucide-react';

/**
 * BookkeepingInterface - Main bookkeeping application component
 * Handles financial management, payments tracking, and revenue analytics
 */
const BookkeepingInterface = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { addPayment } = usePayments();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [paymentSuccessToast, setPaymentSuccessToast] = useState({
    isVisible: false,
    autoEnrolled: false,
    studentName: '',
    courseName: '',
    amount: 0,
    currency: 'EUR'
  });
  const params = useParams();

  const handleRecordPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      // Submit payment to database using the usePayments hook
      const result = await addPayment(paymentData);
      console.log('Payment recorded successfully:', result);
      
      // Close modal after successful submission
      setShowPaymentModal(false);
      
      // Show payment success toast
      setPaymentSuccessToast({
        isVisible: true,
        autoEnrolled: result.autoEnrolled || false,
        studentName: paymentData.studentName || 'Unknown Student',
        courseName: paymentData.courseName || 'Unknown Course',
        amount: parseFloat(paymentData.amount) || 0,
        currency: paymentData.currency || selectedCurrency
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error; // Let the PaymentModal handle the error display
    }
  };



  useEffect(() => {
    if (params.paymentId) {
      // Handle payment details route
      console.log('Payment details route accessed');
    }
  }, [params.paymentId]);

  return (
    <InterfaceWrapper>
      <BookkeepingLayout
        userProfile={userProfile}
        currentUser={currentUser}
        onLogout={logout}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">Financial Overview</h1>
            <button
              onClick={handleRecordPayment}
              className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Record Payment
            </button>
          </div>
          
          <div className="flex items-center">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="EUR">EUR</option>
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Financial Overview Cards */}
          <FinancialOverview currency={selectedCurrency} />

          {/* Recent Transactions */}
          <div className="px-6">
            <PaymentsList currency={selectedCurrency} />
          </div>

          {/* Revenue Chart */}
          <div className="p-6">
            <RevenueChart currency={selectedCurrency} />
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          onSubmit={handlePaymentSubmit}
          currency={selectedCurrency}
          title="Record Payment"
          description="Add a new payment record to the financial system"
          submitButtonText="Record Payment"
        />

        {/* Payment Success Toast */}
        {paymentSuccessToast.isVisible && (
          <PaymentSuccessToast
            isVisible={paymentSuccessToast.isVisible}
            onDismiss={() => setPaymentSuccessToast({
              isVisible: false,
              autoEnrolled: false,
              studentName: '',
              courseName: '',
              amount: 0,
              currency: selectedCurrency
            })}
            autoEnrolled={paymentSuccessToast.autoEnrolled}
            studentName={paymentSuccessToast.studentName}
            courseName={paymentSuccessToast.courseName}
            amount={paymentSuccessToast.amount}
            currency={paymentSuccessToast.currency}
          />
        )}
      </BookkeepingLayout>
    </InterfaceWrapper>
  );
};

export default BookkeepingInterface; 