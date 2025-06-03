import React from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify';

const TaskSourceMessage = ({ sourceMessage, onJumpToMessage, onDeleteTask }) => {
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
                   ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    return (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Source Message</h4>
                <button 
                    onClick={onDeleteTask}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete task"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-medium">
                        {sourceMessage.sender?.displayName?.charAt(0) || 
                         sourceMessage.sender?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-3 flex-1">
                        <div className="flex items-center">
                            <span className="font-medium text-gray-900">
                                {sourceMessage.sender?.displayName || 'Unknown User'}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                                {formatTimestamp(sourceMessage.timestamp)}
                            </span>
                        </div>
                        <div className="mt-1 text-gray-800 text-left break-words whitespace-pre-wrap overflow-wrap-anywhere line-clamp-3 overflow-hidden">
                            {sourceMessage.content?.includes('<') && sourceMessage.content?.includes('>') ? (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(sourceMessage.content, {
                                            ALLOWED_TAGS: [
                                                'p', 'br', 'strong', 'em', 'u', 'strike', 'ul', 'ol', 'li', 
                                                'blockquote', 'pre', 'code', 'a', 'div', 'span', 'h1', 'h2', 
                                                'h3', 'h4', 'h5', 'h6', 'style'
                                            ],
                                            ALLOWED_ATTR: [
                                                'href', 'target', 'rel', 'style', 'class', 'title'
                                            ],
                                            ALLOW_DATA_ATTR: false
                                        })
                                    }}
                                />
                            ) : (
                                sourceMessage.content
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <button 
                        onClick={onJumpToMessage}
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Jump to message
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskSourceMessage; 