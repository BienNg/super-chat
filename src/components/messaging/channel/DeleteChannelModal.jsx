import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

const DeleteChannelModal = ({ isOpen, onClose, channel, onConfirm, loading = false }) => {
    const [confirmationText, setConfirmationText] = useState('');
    const [error, setError] = useState('');

    if (!isOpen || !channel) return null;

    const expectedText = channel.name;
    const isConfirmationValid = confirmationText === expectedText;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isConfirmationValid) {
            setError('Channel name does not match');
            return;
        }

        try {
            setError('');
            await onConfirm();
        } catch (error) {
            setError(error.message || 'Failed to delete channel');
        }
    };

    const handleClose = () => {
        if (!loading) {
            setConfirmationText('');
            setError('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Delete Channel</h2>
                            <p className="text-sm text-gray-500">This action cannot be undone</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4">
                        {/* Warning */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-800">
                                    <p className="font-medium mb-2">This will permanently delete:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>All messages in #{channel.name}</li>
                                        <li>All file attachments</li>
                                        <li>All message reactions and threads</li>
                                        <li>Channel settings and member list</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Channel Info */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Channel Details</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Name:</span> #{channel.name}</p>
                                <p><span className="font-medium">Type:</span> {channel.type || 'general'}</p>
                                <p><span className="font-medium">Members:</span> {channel.members?.length || 0}</p>
                                <p><span className="font-medium">Created:</span> {channel.createdAt ? new Date(channel.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                        </div>

                        {/* Confirmation Input */}
                        <div>
                            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-900 mb-2">
                                Type <span className="font-mono bg-gray-100 px-1 rounded">{expectedText}</span> to confirm deletion:
                            </label>
                            <input
                                id="confirmation"
                                type="text"
                                value={confirmationText}
                                onChange={(e) => {
                                    setConfirmationText(e.target.value);
                                    setError('');
                                }}
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:bg-gray-50"
                                placeholder="Enter channel name"
                                autoComplete="off"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isConfirmationValid || loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                Delete Channel
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteChannelModal; 