import React, { useState, useEffect } from 'react';
import { Undo2, X, CheckCircle, AlertCircle } from 'lucide-react';

const UndoDeleteToast = ({ 
    isVisible, 
    onUndo, 
    onDismiss, 
    undoTimeoutSeconds = 10,
    messagePreview = '',
    deleteType = 'soft'
}) => {
    const [timeLeft, setTimeLeft] = useState(undoTimeoutSeconds);
    const [isUndoing, setIsUndoing] = useState(false);
    const [undoResult, setUndoResult] = useState(null);

    // Countdown timer
    useEffect(() => {
        if (!isVisible || undoResult) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    onDismiss?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible, onDismiss, undoResult]);

    // Reset state when toast becomes visible
    useEffect(() => {
        if (isVisible) {
            setTimeLeft(undoTimeoutSeconds);
            setIsUndoing(false);
            setUndoResult(null);
        }
    }, [isVisible, undoTimeoutSeconds]);

    const handleUndo = async () => {
        if (isUndoing || undoResult) return;

        setIsUndoing(true);
        try {
            await onUndo?.();
            setUndoResult('success');
            
            // Auto-dismiss after showing success
            setTimeout(() => {
                onDismiss?.();
            }, 2000);
        } catch (error) {
            console.error('Undo failed:', error);
            setUndoResult('error');
            
            // Auto-dismiss after showing error
            setTimeout(() => {
                onDismiss?.();
            }, 3000);
        } finally {
            setIsUndoing(false);
        }
    };

    const getProgressPercentage = () => {
        return ((undoTimeoutSeconds - timeLeft) / undoTimeoutSeconds) * 100;
    };

    const truncateMessage = (text, maxLength = 50) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (!isVisible) return null;

    // Success state
    if (undoResult === 'success') {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Message restored</p>
                        <p className="text-xs text-green-100 truncate">
                            {truncateMessage(messagePreview)}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (undoResult === 'error') {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Failed to restore message</p>
                        <p className="text-xs text-red-100">Please try again or contact support</p>
                    </div>
                    <button 
                        onClick={onDismiss}
                        className="text-red-200 hover:text-white flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Default undo state
    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden max-w-sm">
                {/* Progress bar */}
                <div className="h-1 bg-gray-700">
                    <div 
                        className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${getProgressPercentage()}%` }}
                    />
                </div>
                
                {/* Content */}
                <div className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium">
                                    Message {deleteType === 'hard' ? 'deleted' : 'hidden'}
                                </p>
                                <span className="text-xs text-gray-300 bg-gray-700 px-2 py-0.5 rounded-full">
                                    {timeLeft}s
                                </span>
                            </div>
                            {messagePreview && (
                                <p className="text-xs text-gray-300 truncate">
                                    {truncateMessage(messagePreview)}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                                onClick={handleUndo}
                                disabled={isUndoing || deleteType === 'hard'}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                    deleteType === 'hard' 
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : isUndoing
                                        ? 'bg-orange-600 text-orange-200 cursor-wait'
                                        : 'bg-orange-600 hover:bg-orange-500 text-white'
                                }`}
                            >
                                {isUndoing ? (
                                    <>
                                        <div className="w-3 h-3 border border-orange-200 border-t-transparent rounded-full animate-spin" />
                                        <span>Undoing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Undo2 className="w-3 h-3" />
                                        <span>Undo</span>
                                    </>
                                )}
                            </button>
                            
                            <button 
                                onClick={onDismiss}
                                className="text-gray-400 hover:text-white p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {deleteType === 'hard' && (
                        <div className="mt-2 text-xs text-gray-400">
                            Permanently deleted messages cannot be restored
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UndoDeleteToast; 