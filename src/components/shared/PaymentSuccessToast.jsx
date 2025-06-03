import React, { useState, useEffect } from 'react';
import { CheckCircle, X, UserPlus, CreditCard } from 'lucide-react';

/**
 * PaymentSuccessToast - Success toast for payment operations
 * Shows special messaging when auto-enrollment occurs
 */
const PaymentSuccessToast = ({ 
    isVisible, 
    onDismiss,
    autoEnrolled = false,
    studentName = '',
    courseName = '',
    amount = 0,
    currency = 'VND',
    autoHide = true,
    duration = 5000
}) => {
    const [isExiting, setIsExiting] = useState(false);

    // Auto-hide functionality
    useEffect(() => {
        if (isVisible && autoHide) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, autoHide, duration]);

    // Reset exit state when visibility changes
    useEffect(() => {
        if (isVisible) {
            setIsExiting(false);
        }
    }, [isVisible]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss?.();
        }, 300); // Match animation duration
    };

    const formatCurrency = (amount, curr = currency) => {
        const formatters = {
            'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
            'VND': new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
            'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
        };
        
        return formatters[curr]?.format(amount) || `${curr} ${amount?.toLocaleString() || 0}`;
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
            isExiting ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}>
            <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm ${
                autoEnrolled ? 'border-l-4 border-l-indigo-500' : 'border-l-4 border-l-green-500'
            }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            autoEnrolled ? 'bg-indigo-100' : 'bg-green-100'
                        }`}>
                            <CheckCircle className={`w-5 h-5 ${
                                autoEnrolled ? 'text-indigo-600' : 'text-green-600'
                            }`} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                Payment Recorded
                            </h3>
                            {autoEnrolled && (
                                <p className="text-xs text-indigo-600 font-medium">
                                    Student Auto-Enrolled
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    {/* Payment Info */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CreditCard className="w-4 h-4" />
                        <span>{formatCurrency(amount)} recorded successfully</span>
                    </div>

                    {/* Student Info */}
                    {studentName && (
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{studentName}</span>
                            {courseName && <span> • {courseName}</span>}
                        </div>
                    )}

                    {/* Auto-enrollment message */}
                    {autoEnrolled && (
                        <div className="mt-3 p-2 bg-indigo-50 rounded-lg">
                            <div className="flex items-center space-x-2 text-sm text-indigo-800">
                                <UserPlus className="w-4 h-4" />
                                <span className="font-medium">Student automatically enrolled</span>
                            </div>
                            <p className="text-xs text-indigo-600 mt-1">
                                The student has been enrolled in this course
                            </p>
                        </div>
                    )}
                </div>

                {/* Progress bar for auto-hide */}
                {autoHide && (
                    <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all ease-linear ${
                                autoEnrolled ? 'bg-indigo-500' : 'bg-green-500'
                            }`}
                            style={{
                                width: '100%',
                                animation: `shrink ${duration}ms linear`
                            }}
                        />
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default PaymentSuccessToast; 