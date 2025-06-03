import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MessageSquare, Users, Pin } from 'lucide-react';

const DeleteMessageModal = ({ 
    message, 
    isOpen, 
    onConfirm, 
    onCancel,
    canHardDelete = false,
    hasReplies = false,
    isPinned = false,
    isWithinEditWindow = true
}) => {
    const [deleteType, setDeleteType] = useState('soft');
    const [reason, setReason] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setDeleteType('soft');
            setReason('');
            setShowAdvanced(false);
            setIsDeleting(false);
        }
    }, [isOpen]);

    // Force soft delete if message has replies
    useEffect(() => {
        if (hasReplies && deleteType === 'hard') {
            setDeleteType('soft');
        }
    }, [hasReplies, deleteType]);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm({
                deleteType,
                reason: reason.trim() || null,
                forceHard: deleteType === 'hard'
            });
        } catch (error) {
            console.error('Delete confirmation error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getDeleteTypeDescription = () => {
        if (deleteType === 'soft') {
            return 'Message will be hidden but can be recovered by administrators.';
        }
        return 'Message will be permanently deleted and cannot be recovered.';
    };

    const getWarnings = () => {
        const warnings = [];
        
        if (hasReplies) {
            warnings.push({
                icon: MessageSquare,
                text: 'This message has replies. Deleting it will affect the thread structure.',
                severity: 'warning'
            });
        }
        
        if (isPinned) {
            warnings.push({
                icon: Pin,
                text: 'This message is pinned to the channel and will be unpinned.',
                severity: 'info'
            });
        }
        
        if (!isWithinEditWindow) {
            warnings.push({
                icon: Clock,
                text: 'This message is older than 15 minutes. Only administrators can delete it.',
                severity: 'warning'
            });
        }
        
        if (deleteType === 'hard') {
            warnings.push({
                icon: AlertTriangle,
                text: 'Permanent deletion cannot be undone. All attachments will also be deleted.',
                severity: 'error'
            });
        }
        
        return warnings;
    };

    if (!isOpen) return null;

    const warnings = getWarnings();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Delete Message
                            </h3>
                            <p className="text-sm text-gray-500">
                                This action cannot be easily undone
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Message Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message to delete:
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {message?.author?.displayName?.charAt(0) || 'U'}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {message?.author?.displayName || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {message?.createdAt && new Date(message.createdAt.toDate()).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 break-words line-clamp-3">
                                {message?.content || 'No content'}
                            </p>
                            {message?.attachments?.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500">
                                    📎 {message.attachments.length} attachment(s)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <div className="space-y-2">
                            {warnings.map((warning, index) => {
                                const Icon = warning.icon;
                                const bgColor = warning.severity === 'error' ? 'bg-red-50 border-red-200' :
                                               warning.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                               'bg-blue-50 border-blue-200';
                                const textColor = warning.severity === 'error' ? 'text-red-800' :
                                                 warning.severity === 'warning' ? 'text-yellow-800' :
                                                 'text-blue-800';
                                const iconColor = warning.severity === 'error' ? 'text-red-500' :
                                                 warning.severity === 'warning' ? 'text-yellow-500' :
                                                 'text-blue-500';

                                return (
                                    <div key={index} className={`border rounded-lg p-3 ${bgColor}`}>
                                        <div className="flex items-start space-x-2">
                                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                                            <p className={`text-sm ${textColor}`}>
                                                {warning.text}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Deletion Type Selection */}
                    {canHardDelete && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Deletion Type
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deleteType"
                                        value="soft"
                                        checked={deleteType === 'soft'}
                                        onChange={(e) => setDeleteType(e.target.value)}
                                        className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            Hide Message (Recommended)
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Message will be hidden but can be recovered by administrators
                                        </div>
                                    </div>
                                </label>
                                
                                <label className={`flex items-start space-x-3 cursor-pointer ${hasReplies ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="radio"
                                        name="deleteType"
                                        value="hard"
                                        checked={deleteType === 'hard'}
                                        onChange={(e) => setDeleteType(e.target.value)}
                                        disabled={hasReplies}
                                        className="mt-1 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            Permanently Delete
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Message and all attachments will be permanently removed
                                        </div>
                                        {hasReplies && (
                                            <div className="text-xs text-red-500 mt-1">
                                                Cannot permanently delete messages with replies
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Advanced Options */}
                    {canHardDelete && (
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                            </button>
                            
                            {showAdvanced && (
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reason for deletion (optional)
                                        </label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Enter reason for audit log..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            rows={2}
                                            maxLength={200}
                                        />
                                        <div className="text-xs text-gray-500 mt-1">
                                            {reason.length}/200 characters
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                            {getDeleteTypeDescription()}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                            deleteType === 'hard' 
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                                : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                        }`}
                    >
                        {isDeleting ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Deleting...</span>
                            </div>
                        ) : (
                            `${deleteType === 'hard' ? 'Permanently Delete' : 'Delete'} Message`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteMessageModal; 