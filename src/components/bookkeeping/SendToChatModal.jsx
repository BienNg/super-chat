import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import { useChannels } from '../../hooks/useChannels';
import { useMessages } from '../../hooks/useMessages';

/**
 * SendToChatModal - Modal for sending payment details to a chat channel
 * Allows user to select a channel and add a custom message
 */
const SendToChatModal = ({ isOpen, onClose, payment, currency = 'EUR' }) => {
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

  const formatCurrency = (amount, curr = currency) => {
    const formatters = {
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      'VND': new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    };
    
    return formatters[curr]?.format(amount) || `${curr} ${amount.toLocaleString()}`;
  };

  const generatePaymentPreview = () => {
    if (!payment) return '';

    const paymentUrl = `${window.location.origin}/bookkeeping/payment/${payment.id}`;
    
    // Create a beautiful payment card with gradient background
    const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const icon = '💰';
    const title = 'Payment Details';
    
    // Beautiful gradient card with modern typography
    return `<div style="background: ${gradient}; color: white; padding: 16px; border-radius: 12px; margin: 8px 0; max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; font-size: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); position: relative; overflow: hidden;"><div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);"></div><div style="position: relative; z-index: 1;"><div style="display: flex; align-items: center; margin-bottom: 12px;"><div style="width: 32px; height: 32px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 12px; backdrop-filter: blur(10px);">${icon}</div><div style="flex: 1;"><div style="font-weight: 600; font-size: 18px; line-height: 1.3; margin-bottom: 2px;">${title}</div><div style="font-size: 14px; opacity: 0.9; line-height: 1.3;">${new Date(payment.createdAt).toLocaleDateString()}</div></div></div><div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 12px; backdrop-filter: blur(10px);"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><div style="flex: 1;"><div style="font-size: 11px; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px; letter-spacing: 0.5px; font-weight: 500;">Student</div><div style="font-size: 15px; font-weight: 600; line-height: 1.3;">${payment.studentName}</div></div><div style="text-align: right;"><div style="font-size: 11px; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px; letter-spacing: 0.5px; font-weight: 500;">Amount</div><div style="font-size: 17px; font-weight: 700; line-height: 1.3;">${formatCurrency(payment.amount, payment.currency)}</div></div></div><div style="margin-bottom: 8px;"><div style="font-size: 11px; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px; letter-spacing: 0.5px; font-weight: 500;">Course</div><div style="font-size: 15px; font-weight: 600; line-height: 1.3;">${payment.courseName}</div></div>${payment.notes ? `<div><div style="font-size: 11px; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px; letter-spacing: 0.5px; font-weight: 500;">Notes</div><div style="font-size: 13px; font-style: italic; opacity: 0.9; line-height: 1.4;">${payment.notes}</div></div>` : ''}</div><div style="display: flex;"><a href="${paymentUrl}" target="_blank" style="flex: 1; display: block; background: rgba(255,255,255,0.95); color: #4C1D95; text-decoration: none; padding: 10px 16px; text-align: center; border-radius: 6px; font-size: 14px; font-weight: 600; transition: all 0.2s ease; backdrop-filter: blur(10px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">View Details</a></div></div></div>`;
  };

  const handleSend = async () => {
    if (!selectedChannelId) {
      setError('Please select a channel');
      return;
    }

    if (!message.trim() && !payment) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const paymentPreview = generatePaymentPreview();
      const fullMessage = message.trim() 
        ? `${message}\n\n${paymentPreview}`
        : paymentPreview;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Send to Chat</h3>
              <p className="text-sm text-gray-500">Share payment details with your team</p>
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
            {/* Payment Summary */}
            {payment && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><span className="font-medium">Student:</span> {payment.studentName}</div>
                  <div><span className="font-medium">Course:</span> {payment.courseName}</div>
                  <div><span className="font-medium">Amount:</span> {formatCurrency(payment.amount, payment.currency)}</div>
                </div>
              </div>
            )}

            {/* Message Preview */}
            {payment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Message Preview
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-xs text-gray-500 mb-3">This is how your message will appear in the chat:</p>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generatePaymentPreview() 
                    }}
                    className="transform scale-75 origin-top-left"
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
                placeholder="Add a message to accompany the payment details..."
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !selectedChannelId}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send to Chat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendToChatModal; 