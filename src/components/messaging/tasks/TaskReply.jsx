import React from 'react';
import { Clock } from 'lucide-react';

const TaskReply = ({ reply, taskId }) => {
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
        <div className="flex items-start group">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-medium">
                {reply.author?.displayName?.charAt(0) || 
                 reply.author?.email?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 flex-1">
                <div className="flex items-center">
                    <span className="font-medium text-gray-900">
                        {reply.author?.displayName || 'Unknown User'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimestamp(reply.createdAt)}
                    </span>
                </div>
                <div className="mt-1 text-gray-800 text-left break-words whitespace-pre-wrap overflow-wrap-anywhere">
                    {reply.content}
                </div>
                {/* Future: Add reply actions like edit, delete, react */}
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Reply actions will go here */}
                </div>
            </div>
        </div>
    );
};

export default TaskReply; 