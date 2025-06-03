import React, { useRef, useState } from 'react';
import TaskThread from './TaskThread';
import TaskComposer from './TaskComposer';
import TaskDetailsEmpty from './TaskDetailsEmpty';
import { useTasks } from '../../../hooks/useTasks';
import { useThreadReplies } from '../../../hooks/useThreadReplies';
import { Calendar, Clock, Users, ExternalLink, Trash2, Check } from 'lucide-react';

const TaskDetails = ({ task, channelId, onTaskUpdate, onTaskDelete, onJumpToMessage }) => {
    // Use real useTasks hook for task operations
    const { deleteTask, markTaskComplete, updateTaskLastActivity } = useTasks(channelId);
    
    // Use unified threading system - same as message threads
    const { sendReply } = useThreadReplies(channelId, task?.sourceMessageId);

    // Add throttling to prevent rapid successive sends
    const lastSendTimeRef = useRef(0);
    const MIN_SEND_INTERVAL = 1000; // 1 second minimum between sends
    const [isSending, setIsSending] = useState(false);

    if (!task) {
        return <TaskDetailsEmpty />;
    }

    const handleSendMessage = async (messageData) => {
        if (!messageData.content.trim() || isSending) {
            return;
        }
        
        // Throttle rapid sends
        const now = Date.now();
        const timeSinceLastSend = now - lastSendTimeRef.current;
        if (timeSinceLastSend < MIN_SEND_INTERVAL) {
            return;
        }
        
        setIsSending(true);
        
        try {
            lastSendTimeRef.current = now;
            
            // Use the same reply system as message threads
            await sendReply(messageData.content);
            
            // Update task last activity immediately
            if (task?.id) {
                await updateTaskLastActivity(task.id);
            }
        } catch (error) {
            console.error('Failed to add reply to thread:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleJumpToMessage = () => {
        if (onJumpToMessage && task?.sourceMessageId) {
            onJumpToMessage(task.sourceMessageId);
        }
    };

    const handleDeleteTask = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask(task.id);
            } catch (error) {
                console.error('Failed to delete task:', error);
            }
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString([], { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };
    
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden bg-gray-50">
            {/* Task metadata */}
            <div className="bg-white p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <h3 className="text-xl font-bold text-gray-900 mr-2">Task Details</h3>
                        <button 
                            onClick={handleJumpToMessage}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                            title="Jump to original message"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            {task.status}
                        </span>
                    </div>
                    
                    {/* Complete button and participants */}
                    <div className="flex items-center space-x-3">
                        {task.participants && task.participants.length > 0 && (
                            <div className="flex items-center">
                                <div className="flex -space-x-2">
                                    {task.participants.slice(0, 3).map((participant, idx) => (
                                        <div 
                                            key={idx} 
                                            className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white"
                                            title={participant.displayName}
                                        >
                                            {participant.displayName?.charAt(0) || 'U'}
                                        </div>
                                    ))}
                                </div>
                                {task.participants.length > 3 && (
                                    <span className="ml-1 text-xs text-gray-500">
                                        +{task.participants.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                        {task.status === 'active' && (
                            <button 
                                onClick={() => markTaskComplete(task.id)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors flex items-center text-sm font-medium"
                                title="Mark as complete"
                            >
                                <Check className="h-4 w-4 mr-1.5" />
                                Complete
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-gray-500 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created {formatDate(task.createdAt)} at {formatTime(task.createdAt)}</span>
                </div>
            </div>

            {/* Thread Conversation - Scrollable content area with source message */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                <TaskThread 
                    taskId={task.id}
                    sourceMessageId={task.sourceMessageId}
                    channelId={channelId}
                    sourceMessage={task.sourceMessageData}
                    onJumpToMessage={handleJumpToMessage}
                    onDeleteTask={handleDeleteTask}
                />
            </div>

            {/* Message Composer - Fixed height - KEEPING THIS THE SAME */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200">
                <TaskComposer 
                    onSendMessage={handleSendMessage}
                    placeholder="Add a comment..."
                    channelId={channelId}
                    threadId={task?.sourceMessageId}
                    isLoading={isSending}
                />
            </div>
        </div>
    );
};

export default TaskDetails; 