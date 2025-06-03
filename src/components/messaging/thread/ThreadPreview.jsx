import React from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { useThreadReplies } from '../../../hooks/useThreadReplies';
import './ThreadPreview.css';

const ThreadPreview = ({ 
    message, 
    onOpenThread, 
    className = "",
    channelId // Need channelId to fetch replies
}) => {
    // OPTIMIZATION: Get real-time reply count instead of using stored metadata
    const { replies, loading } = useThreadReplies(channelId, message.id);
    const actualReplyCount = replies.length;
    
    // Extract thread data from message with real-time data
    const threadData = {
        replyCount: actualReplyCount, // Use actual count from replies
        lastReply: replies.length > 0 ? replies[replies.length - 1] : null, // Get last reply from actual data
        participants: getUniqueParticipants(replies, message),
        lastActivity: replies.length > 0 ? replies[replies.length - 1].createdAt : null
    };

    // Get unique participants from replies + original message author
    function getUniqueParticipants(replies, originalMessage) {
        const participantMap = new Map();
        
        // Add original message author
        if (originalMessage.author) {
            participantMap.set(
                originalMessage.author.id || originalMessage.author.email, 
                originalMessage.author
            );
        }
        
        // Add reply authors
        replies.forEach(reply => {
            if (reply.author) {
                participantMap.set(
                    reply.author.id || reply.author.email, 
                    reply.author
                );
            }
        });
        
        return Array.from(participantMap.values());
    }

    // Get author initials for avatar
    const getAuthorInitials = (author) => {
        if (!author) return 'U';
        return author.displayName?.charAt(0) || author.email?.charAt(0) || 'U';
    };

    // Get a consistent color based on user email or name
    const getAuthorColor = (author) => {
        if (!author) return 'bg-gray-400';
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'];
        const str = author.displayName || author.email || '';
        const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return diffInMinutes <= 1 ? 'just now' : `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };

    if (threadData.replyCount === 0) return null;

    return (
        <div className={`thread-preview-container ${className}`}>
            <button
                onClick={() => onOpenThread(message.id)}
                className="thread-preview-button"
            >
                {/* Thread participants avatars */}
                <div className="thread-preview-avatars">
                    {threadData.participants.slice(0, 3).map((participant, index) => (
                        <div
                            key={participant.id || index}
                            className={`thread-preview-avatar ${getAuthorColor(participant)}`}
                            title={participant.displayName || participant.email}
                        >
                            {getAuthorInitials(participant)}
                        </div>
                    ))}
                    {threadData.participants.length > 3 && (
                        <div className="thread-preview-avatar bg-gray-400">
                            +{threadData.participants.length - 3}
                        </div>
                    )}
                </div>

                {/* Thread info - Fixed width container */}
                <div className="thread-preview-content">
                    <div className="thread-preview-header">
                        <MessageSquare className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span className="thread-preview-count">
                            {threadData.replyCount} {threadData.replyCount === 1 ? 'reply' : 'replies'}
                        </span>
                        {threadData.lastActivity && (
                            <>
                                <span className="thread-preview-separator">•</span>
                                <span className="thread-preview-time">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTimestamp(threadData.lastActivity)}
                                </span>
                            </>
                        )}
                    </div>
                    
                    {/* Latest reply preview - Consistent truncation */}
                    {threadData.lastReply && (
                        <div className="thread-preview-reply">
                            <span className="thread-preview-reply-author">
                                {threadData.lastReply.author?.displayName || 'Someone'}:
                            </span>
                            <span className="thread-preview-reply-content">
                                {threadData.lastReply.content}
                            </span>
                        </div>
                    )}
                </div>

                {/* View thread indicator - Always visible */}
                <div className="thread-preview-action">
                    View thread
                </div>
            </button>
        </div>
    );
};

export default ThreadPreview; 