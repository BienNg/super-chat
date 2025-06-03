import React, { useEffect, useRef } from 'react';
import TaskReply from './TaskReply';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { useThreadReplies } from '../../../hooks/useThreadReplies';
import DOMPurify from 'dompurify';

const TaskThread = ({ taskId, sourceMessageId, channelId, sourceMessage, onJumpToMessage, onDeleteTask }) => {
    const messagesEndRef = useRef(null);
    const previousReplyCountRef = useRef(0);
    const hasInitiallyScrolledRef = useRef(false);

    // Use the unified threading system via useThreadReplies hook
    const { replies, loading, error } = useThreadReplies(channelId, sourceMessageId);

    // Auto-scroll to bottom when new replies are added or on initial load
    useEffect(() => {
        const currentReplyCount = replies.length;
        const previousReplyCount = previousReplyCountRef.current;
        
        // Scroll to bottom if:
        // 1. New replies were added (currentReplyCount > previousReplyCount)
        // 2. Initial load with existing replies (!hasInitiallyScrolledRef.current && currentReplyCount > 0)
        if ((currentReplyCount > previousReplyCount && currentReplyCount > 0) || 
            (!hasInitiallyScrolledRef.current && currentReplyCount > 0 && !loading)) {
            
            // Use a small timeout to ensure DOM is updated
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
            hasInitiallyScrolledRef.current = true;
        }
        
        // Update the ref with current count
        previousReplyCountRef.current = currentReplyCount;
    }, [replies, loading]);

    // Reset scroll tracking when switching tasks
    useEffect(() => {
        hasInitiallyScrolledRef.current = false;
        previousReplyCountRef.current = 0;
    }, [sourceMessageId]);

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

    const SourceMessageComponent = () => (
        <div className="relative pb-3 mb-3 border-b border-gray-200">
            {/* Source message header */}
            <div className="flex items-center mb-3">
                <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 text-indigo-600 mr-1.5" />
                    <span className="text-sm font-medium text-indigo-600">Source Message</span>
                </div>
                <button 
                    onClick={onJumpToMessage}
                    className="ml-auto mr-2 p-1 rounded hover:bg-indigo-50 text-indigo-500 hover:text-indigo-600 transition-colors"
                    title="Jump to original message"
                >
                    <ExternalLink className="w-4 h-4" />
                </button>
            </div>
            
            {/* Source message content */}
            <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-medium">
                    {sourceMessage?.sender?.displayName?.charAt(0) || 
                     sourceMessage?.sender?.email?.charAt(0) || 'U'}
                </div>
                <div className="ml-3 flex-1">
                    <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                            {sourceMessage?.sender?.displayName || 'Unknown User'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                            {formatTimestamp(sourceMessage?.timestamp)}
                        </span>
                    </div>
                    <div className="mt-1 text-gray-800 text-left break-words whitespace-pre-wrap overflow-wrap-anywhere">
                        {sourceMessage?.content?.includes('<') && sourceMessage?.content?.includes('>') ? (
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
                            sourceMessage?.content
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading conversation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-red-600">Error loading conversation</p>
                    <p className="text-xs text-gray-500 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
                {/* Source message at the top of the scrollable area */}
                {sourceMessage && <SourceMessageComponent />}
                
                {/* Replies */}
                {replies.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-gray-500 text-sm">No comments yet. Start the conversation!</p>
                    </div>
                ) : (
                    replies.map((reply) => (
                        <TaskReply 
                            key={reply.id} 
                            reply={reply} 
                            taskId={taskId}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default TaskThread; 