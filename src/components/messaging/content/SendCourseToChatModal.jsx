import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, BookOpen, Calendar, Users, Globe, Clock, Award } from 'lucide-react';
import { useChannels } from '../../../hooks/useChannels';
import { useMessages } from '../../../hooks/useMessages';

/**
 * SendCourseToChatModal - Modal for sending course details to a chat channel
 * Creates a beautiful preview with course information, schedule, and enrollment stats
 */
const SendCourseToChatModal = ({ isOpen, onClose, course, classData, enrollments = [] }) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getCourseStatus = (course) => {
    if (!course.beginDate || !course.endDate) {
      return 'planning';
    }

    const currentDate = new Date();
    const startDate = new Date(course.beginDate);
    const endDate = new Date(course.endDate);
    
    currentDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (currentDate < startDate) {
      return 'planning';
    } else if (currentDate >= startDate && currentDate <= endDate) {
      return 'active';
    } else {
      return 'completed';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': { bg: 'rgba(34, 197, 94, 0.15)', color: '#15803d', icon: '🟢' },
      'planning': { bg: 'rgba(234, 179, 8, 0.15)', color: '#a16207', icon: '🟡' },
      'completed': { bg: 'rgba(107, 114, 128, 0.15)', color: '#374151', icon: '⚪' }
    };
    return colors[status] || colors.active;
  };

  const generateCoursePreview = () => {
    if (!course) return '';

    const courseUrl = `${window.location.origin}/channels/${course.channelId || 'unknown'}/classes`;
    const status = getCourseStatus(course);
    const statusInfo = getStatusColor(status);
    
    // Create a beautiful course card with gradient background
    const gradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)';
    const icon = '📚';
    const title = 'Course Details';
    
    // Beautiful gradient card with comprehensive course information
    return `<div style="background: ${gradient}; color: white; padding: 20px; border-radius: 16px; margin: 8px 0; max-width: 420px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; font-size: 16px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15); position: relative; overflow: hidden;"><div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);"></div><div style="position: relative; z-index: 1;"><div style="display: flex; align-items: center; margin-bottom: 16px;"><div style="width: 36px; height: 36px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 14px; backdrop-filter: blur(10px);">${icon}</div><div style="flex: 1;"><div style="font-weight: 700; font-size: 20px; line-height: 1.3; margin-bottom: 2px;">${title}</div><div style="font-size: 14px; opacity: 0.9; line-height: 1.3;">Course Information & Schedule</div></div></div><div style="background: rgba(255,255,255,0.1); padding: 14px; border-radius: 10px; margin-bottom: 16px; backdrop-filter: blur(10px);"><div style="font-size: 18px; font-weight: 700; line-height: 1.3; margin-bottom: 8px;">${course.courseName || 'Untitled Course'}</div><div style="display: flex; align-items: center; margin-bottom: 6px;"><div style="width: 16px; height: 16px; background: rgba(255,255,255,0.2); border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 8px;">🎯</div><span style="font-size: 14px; font-weight: 600; opacity: 0.9;">${course.level || 'Level not specified'}</span></div><div style="display: flex; align-items: center; margin-bottom: 6px;"><div style="width: 16px; height: 16px; background: rgba(255,255,255,0.2); border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 8px;">🌐</div><span style="font-size: 14px; font-weight: 600; opacity: 0.9;">${classData?.format || 'Format not specified'} • ${classData?.formatOption || 'Platform not specified'}</span></div><div style="display: flex; align-items: center;"><div style="width: 16px; height: 16px; background: ${statusInfo.bg}; border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 8px;">${statusInfo.icon}</div><span style="font-size: 14px; font-weight: 600; opacity: 0.9; text-transform: capitalize;">${status}</span></div></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;"><div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; backdrop-filter: blur(10px);"><div style="display: flex; align-items: center; margin-bottom: 6px;"><div style="width: 16px; height: 16px; background: rgba(255,255,255,0.2); border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 6px; font-size: 8px;">📅</div><div style="font-size: 10px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; font-weight: 600;">Schedule</div></div><div style="font-size: 13px; font-weight: 600; line-height: 1.3; margin-bottom: 2px;">${course.days?.join(', ') || 'No schedule'}</div><div style="font-size: 11px; opacity: 0.8;">${formatDate(course.beginDate)} - ${formatDate(course.endDate)}</div></div><div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; backdrop-filter: blur(10px);"><div style="display: flex; align-items: center; margin-bottom: 6px;"><div style="width: 16px; height: 16px; background: rgba(255,255,255,0.2); border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 6px; font-size: 8px;">👥</div><div style="font-size: 10px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; font-weight: 600;">Students</div></div><div style="font-size: 16px; font-weight: 700; line-height: 1.3;">${enrollments.length}</div><div style="font-size: 11px; opacity: 0.8;">enrolled</div></div></div>${course.teachers && course.teachers.length > 0 ? `<div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px; backdrop-filter: blur(10px);"><div style="display: flex; align-items: center; margin-bottom: 8px;"><div style="width: 16px; height: 16px; background: rgba(255,255,255,0.2); border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 6px; font-size: 8px;">👨‍🏫</div><div style="font-size: 10px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; font-weight: 600;">Instructors</div></div><div style="font-size: 14px; font-weight: 600; line-height: 1.4;">${course.teachers.join(', ')}</div></div>` : ''}<div style="display: flex;"><a href="${courseUrl}" target="_blank" style="flex: 1; display: block; background: rgba(255,255,255,0.15); color: white; text-decoration: none; padding: 12px 16px; text-align: center; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.2s ease; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">View Course</a></div></div></div>`;
  };

  const handleSend = async () => {
    if (!selectedChannelId) {
      setError('Please select a channel');
      return;
    }

    if (!message.trim() && !course) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const coursePreview = generateCoursePreview();
      const fullMessage = message.trim() 
        ? `${message}\n\n${coursePreview}`
        : coursePreview;

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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Send Course to Chat</h3>
              <p className="text-sm text-gray-500">Share course details with your team</p>
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
            {/* Course Summary */}
            {course && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
                  Course Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <div className="space-y-1">
                      <div><span className="font-medium">Course:</span> {course.courseName}</div>
                      <div><span className="font-medium">Level:</span> {course.level}</div>
                      <div><span className="font-medium">Format:</span> {classData?.format} - {classData?.formatOption}</div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-1">
                      <div><span className="font-medium">Schedule:</span> {course.days?.join(', ') || 'No schedule'}</div>
                      <div><span className="font-medium">Duration:</span> {formatDate(course.beginDate)} - {formatDate(course.endDate)}</div>
                      <div><span className="font-medium">Students:</span> {enrollments.length} enrolled</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message Preview */}
            {course && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Message Preview
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-xs text-gray-500 mb-3">This is how your message will appear in the chat:</p>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generateCoursePreview() 
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
                placeholder="Add a message to accompany the course details..."
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

export default SendCourseToChatModal; 