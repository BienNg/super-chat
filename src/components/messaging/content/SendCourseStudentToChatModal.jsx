import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, BookOpen, User, CreditCard } from 'lucide-react';
import { useChannels } from '../../../hooks/useChannels';
import { useMessages } from '../../../hooks/useMessages';

/**
 * SendCourseStudentToChatModal - Modal for sending course enrollment and payment details to a chat channel
 * Creates a wider preview with comprehensive course, student, and payment information
 */
const SendCourseStudentToChatModal = ({ isOpen, onClose, enrollment, course, payments = [] }) => {
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const { channels, loading: channelsLoading } = useChannels();
  const { sendMessage } = useMessages(selectedChannelId);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSelectedChannelId('');
      setMessage('');
      setError('');
    }
  }, [isOpen]);

  const formatCurrency = (amount, currency = 'VND') => {
    const formatters = {
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      'VND': new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    };
    
    return formatters[currency]?.format(amount) || `${currency} ${amount.toLocaleString()}`;
  };

  const generateCourseStudentPreview = () => {
    if (!enrollment || !course) return '';

    const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;
    const hasPayments = payments.length > 0;
    
    // Create a wider, more comprehensive preview card
    const gradient = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)';
    const icon = '🎓';
    const title = 'Course Enrollment Details';
    
    // Beautiful wider gradient card with comprehensive information
    return `<div style="background: ${gradient}; color: white; padding: 20px; border-radius: 16px; margin: 8px 0; max-width: 420px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; font-size: 16px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15); position: relative; overflow: hidden;"><div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);"></div><div style="position: relative; z-index: 1;"><div style="display: flex; align-items: center; margin-bottom: 16px;"><div style="width: 36px; height: 36px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 14px; backdrop-filter: blur(10px);">${icon}</div><div style="flex: 1;"><div style="font-weight: 700; font-size: 20px; line-height: 1.3; margin-bottom: 2px;">${title}</div><div style="font-size: 14px; opacity: 0.9; line-height: 1.3;">${new Date(enrollment.enrollmentDate || enrollment.enrolledAt).toLocaleDateString()}</div></div></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;"><div style="background: rgba(255,255,255,0.1); padding: 14px; border-radius: 10px; backdrop-filter: blur(10px);"><div style="display: flex; align-items: center; margin-bottom: 8px;"><div style="width: 20px; height: 20px; background: rgba(255,255,255,0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 8px;"><span style="font-size: 10px;">📚</span></div><div style="font-size: 11px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; font-weight: 600;">Course</div></div><div style="font-size: 16px; font-weight: 700; line-height: 1.3; margin-bottom: 4px;">${course.courseName}</div><div style="font-size: 13px; opacity: 0.9; font-weight: 500;">${course.level}</div></div><div style="background: rgba(255,255,255,0.1); padding: 14px; border-radius: 10px; backdrop-filter: blur(10px);"><div style="display: flex; align-items: center; margin-bottom: 8px;"><div style="width: 20px; height: 20px; background: rgba(255,255,255,0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 8px;"><span style="font-size: 10px;">👤</span></div><div style="font-size: 11px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; font-weight: 600;">Student</div></div><div style="font-size: 16px; font-weight: 700; line-height: 1.3; margin-bottom: 4px;">${enrollment.studentName}</div><div style="font-size: 13px; opacity: 0.9; font-weight: 500;">${enrollment.studentEmail}</div></div></div><div style="background: rgba(255,255,255,0.1); padding: 14px; border-radius: 10px; margin-bottom: 16px; backdrop-filter: blur(10px);"><div style="display: flex; align-items: center; margin-bottom: 12px;"><div style="width: 20px; height: 20px; background: rgba(255,255,255,0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 8px;"><span style="font-size: 10px;">💰</span></div><div style="font-size: 11px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; font-weight: 600;">Payment Status</div></div><div style="display: flex; justify-content: space-between; align-items: center;"><div><div style="font-size: 18px; font-weight: 700; line-height: 1.3;">${hasPayments ? formatCurrency(totalPaid, latestPayment?.currency) : 'No Payment'}</div><div style="font-size: 13px; opacity: 0.9; margin-top: 2px;">${hasPayments ? `${payments.length} payment${payments.length !== 1 ? 's' : ''}` : 'Payment pending'}</div></div><div style="width: 48px; height: 48px; background: ${hasPayments ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);"><span style="font-size: 20px;">${hasPayments ? '✅' : '⏳'}</span></div></div>${latestPayment ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);"><div style="font-size: 12px; opacity: 0.8;">Last payment: ${new Date(latestPayment.paymentDate || latestPayment.createdAt).toLocaleDateString()}</div></div>` : ''}</div><div style="display: flex; gap: 8px;">${hasPayments ? `<a href="${window.location.origin}/bookkeeping/payment/${latestPayment.id || 'unknown'}" target="_blank" style="flex: 1; display: block; background: rgba(255,255,255,0.15); color: white; text-decoration: none; padding: 10px 14px; text-align: center; border-radius: 8px; font-size: 13px; font-weight: 600; transition: all 0.2s ease; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">View Payment</a>` : ''}<a href="${window.location.origin}/channels/${course.channelId || 'unknown'}/classes" target="_blank" style="flex: 1; display: block; background: rgba(255,255,255,0.15); color: white; text-decoration: none; padding: 10px 14px; text-align: center; border-radius: 8px; font-size: 13px; font-weight: 600; transition: all 0.2s ease; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">View Course</a><a href="${window.location.origin}/crm/students/${enrollment.studentId || 'unknown'}" target="_blank" style="flex: 1; display: block; background: rgba(255,255,255,0.15); color: white; text-decoration: none; padding: 10px 14px; text-align: center; border-radius: 8px; font-size: 13px; font-weight: 600; transition: all 0.2s ease; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">View Student</a></div></div></div>`;
  };

  const handleSend = async () => {
    if (!selectedChannelId) {
      setError('Please select a channel');
      return;
    }

    if (!message.trim() && !enrollment) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const courseStudentPreview = generateCourseStudentPreview();
      const fullMessage = message.trim() 
        ? `${message}\n\n${courseStudentPreview}`
        : courseStudentPreview;

      await sendMessage(fullMessage);
      
      // Close modal on success
      onClose();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  if (!isOpen) return null;

  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const hasPayments = payments.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Send to Chat</h3>
              <p className="text-sm text-gray-500">Share course enrollment details with your team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Enrollment Summary */}
            {enrollment && course && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
                  Course Enrollment Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <div className="space-y-1">
                      <div><span className="font-medium">Course:</span> {course.courseName}</div>
                      <div><span className="font-medium">Level:</span> {course.level}</div>
                      <div><span className="font-medium">Student:</span> {enrollment.studentName}</div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-1">
                      <div><span className="font-medium">Email:</span> {enrollment.studentEmail}</div>
                      <div><span className="font-medium">Enrolled:</span> {new Date(enrollment.enrollmentDate || enrollment.enrolledAt).toLocaleDateString()}</div>
                      <div><span className="font-medium">Payments:</span> {hasPayments ? formatCurrency(totalPaid, payments[0]?.currency) : 'No payments'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message Preview */}
            {enrollment && course && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Message Preview
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-xs text-gray-500 mb-3">This is how your message will appear in the chat:</p>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generateCourseStudentPreview() 
                    }}
                    className="transform scale-65 origin-top-left"
                  />
                </div>
              </div>
            )}

            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Channel
              </label>
              {channelsLoading ? (
                <div className="text-sm text-gray-500">Loading channels...</div>
              ) : (
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a channel...</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name} ({channel.members?.length || 0} members)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Add a message to accompany the course enrollment details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to send
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !selectedChannelId}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendCourseStudentToChatModal; 