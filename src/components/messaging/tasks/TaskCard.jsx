import React, { useState, useEffect } from 'react';
import { Clock, MessageCircle, Calendar, ArrowRight, CheckCircle, Circle } from 'lucide-react';
import DOMPurify from 'dompurify';

const TaskCard = ({ task, isSelected, onSelect, channelId }) => {
    const { sourceMessageData, status, lastActivity, createdAt, sourceMessageId, participants } = task;
    
    // Use reply count from task data instead of live query to reduce Firestore load
    const liveReplyCount = sourceMessageData?.replyCount || 0;

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        const diffInDays = diffInHours / 24;
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays < 7) {
            const options = { weekday: 'short' };
            return date.toLocaleDateString([], options);
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        } else {
            return formatTimestamp(timestamp);
        }
    };

    // Truncate content for preview
    const truncateContent = (content, maxLength = 120) => {
        if (!content) return '';
        
        // Strip HTML tags if present
        let plainText = content;
        if (content.includes('<') && content.includes('>')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = DOMPurify.sanitize(content);
            plainText = tempDiv.textContent || tempDiv.innerText || '';
        }
        
        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength) + '...';
    };

    return (
        <div
            onClick={onSelect}
            className={`relative group rounded-xl border p-4 cursor-pointer transition-all hover:translate-y-[-2px] ${
                isSelected
                    ? 'border-indigo-300 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
        >
            {/* Status indicator */}
            <div className="absolute top-0 right-0 w-3 h-3 transform translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white
                ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}"></div>
            
            <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div 
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium ${
                        status === 'active' ? 'bg-indigo-500' : 'bg-gray-400'
                    }`}
                >
                    {sourceMessageData.sender?.displayName?.charAt(0) || 
                     sourceMessageData.sender?.email?.charAt(0) || 'U'}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                            {sourceMessageData.sender?.displayName || 'Unknown User'}
                        </h4>
                        <div className="flex items-center">
                            {status === 'active' ? (
                                <Circle className="w-3 h-3 text-green-500" />
                            ) : (
                                <CheckCircle className="w-3 h-3 text-gray-400" />
                            )}
                            <span className="ml-1 text-xs font-medium text-gray-500">
                                {status}
                            </span>
                        </div>
                    </div>
                    
                    {/* Task content preview */}
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {truncateContent(sourceMessageData.content)}
                    </p>
                    
                    {/* Footer with metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                            {/* Creation date */}
                            <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatTimestamp(createdAt)}
                            </div>
                            
                            {/* Reply count */}
                            {liveReplyCount > 0 && (
                                <div className="flex items-center">
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    {liveReplyCount}
                                </div>
                            )}
                        </div>
                        
                        {/* Last activity */}
                        {lastActivity && (
                            <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatRelativeTime(lastActivity)}
                            </div>
                        )}
                    </div>
                    
                    {/* Participants */}
                    {participants && participants.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {participants.slice(0, 3).map((participant, idx) => (
                                    <div 
                                        key={idx} 
                                        className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium ring-1 ring-white"
                                        title={participant.displayName}
                                    >
                                        {participant.displayName?.charAt(0) || 'U'}
                                    </div>
                                ))}
                                {participants.length > 3 && (
                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium ring-1 ring-white">
                                        +{participants.length - 3}
                                    </div>
                                )}
                            </div>
                            <button className="text-xs text-indigo-600 font-medium flex items-center hover:text-indigo-800 transition-colors">
                                View <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard; 