import React, { useState } from 'react';
import { CheckSquare, ExternalLink, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';

const BidirectionalLinkingDemo = () => {
    const [currentView, setCurrentView] = useState('messages');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    // Mock data
    const mockMessage = {
        id: 'msg-1',
        content: 'We need to implement the new user authentication system by next Friday. This includes OAuth integration and password reset functionality.',
        author: {
            displayName: 'Sarah Johnson',
            email: 'sarah@company.com'
        },
        createdAt: new Date(),
        isTask: true,
        taskId: 'task-1'
    };

    const mockTask = {
        id: 'task-1',
        sourceMessageId: 'msg-1',
        sourceMessageData: {
            content: 'We need to implement the new user authentication system by next Friday. This includes OAuth integration and password reset functionality.',
            sender: {
                displayName: 'Sarah Johnson',
                email: 'sarah@company.com'
            },
            timestamp: new Date()
        },
        status: 'active',
        participants: [
            { displayName: 'Sarah Johnson', email: 'sarah@company.com' },
            { displayName: 'Mike Chen', email: 'mike@company.com' }
        ]
    };

    const handleJumpToTask = () => {
        setCurrentView('tasks');
        setSelectedTask(mockTask);
        setSelectedMessage(null);
    };

    const handleJumpToMessage = () => {
        setCurrentView('messages');
        setSelectedMessage(mockMessage);
        setSelectedTask(null);
    };

    const MessageView = () => (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Messages Tab
                </h3>
                <span className="text-sm text-gray-500">Channel: #development</span>
            </div>

            {/* Message with Task Indicators */}
            <div className={`border rounded-lg p-4 transition-all ${
                mockMessage.isTask ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50'
            }`}>
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-medium">
                        SJ
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">Sarah Johnson</span>
                            <span className="text-xs text-gray-500">2:30 PM</span>
                            {mockMessage.isTask && (
                                <button
                                    onClick={handleJumpToTask}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                    <CheckSquare className="w-3 h-3 mr-1" />
                                    View Task
                                </button>
                            )}
                        </div>
                        <div className="text-gray-800 text-left break-words">
                            {mockMessage.content}
                        </div>


                    </div>
                </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Bidirectional Linking Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Blue border and background indicate task-linked messages</li>
                    <li>• "View Task" button in message header for easy navigation</li>
                    <li>• Hover actions show "View Task" instead of "Push to Tasks"</li>
                </ul>
            </div>
        </div>
    );

    const TaskView = () => (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" />
                    Tasks Tab
                </h3>
                <span className="text-sm text-gray-500">Active Tasks: 1</span>
            </div>

            {/* Task Details with Source Message */}
            <div className="border rounded-lg overflow-hidden">
                {/* Source Message Section */}
                <div className="bg-indigo-50 border-b border-indigo-200 p-4">
                    <div className="flex items-center mb-2">
                        <MessageSquare className="w-4 h-4 text-indigo-600 mr-2" />
                        <span className="text-sm font-medium text-indigo-600">Source Message</span>
                    </div>
                    
                    <div className="bg-white border border-indigo-200 rounded-lg p-3">
                        <div className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-medium">
                                SJ
                            </div>
                            <div className="ml-3 flex-1">
                                <div className="flex items-center">
                                    <span className="font-medium text-gray-900">Sarah Johnson</span>
                                    <span className="ml-2 text-xs text-gray-500">2:30 PM</span>
                                </div>
                                <div className="mt-1 text-gray-800 text-left break-words">
                                    {mockTask.sourceMessageData.content}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-indigo-100">
                            <button 
                                onClick={handleJumpToMessage}
                                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Jump to message
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Task Details */}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Task Status</span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                        </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="text-sm font-medium text-gray-700">Participants:</span>
                        <div className="flex -space-x-1">
                            {mockTask.participants.map((participant, index) => (
                                <div
                                    key={index}
                                    className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white"
                                    title={participant.displayName}
                                >
                                    {participant.displayName.charAt(0)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Task Navigation Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Source message displayed in blue container</li>
                    <li>• "Jump to message" button opens thread in Messages tab</li>
                    <li>• Unified threading system for task conversations</li>
                    <li>• Real-time synchronization between tabs</li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Bidirectional Linking Demo
                </h2>
                <p className="text-gray-600">
                    Seamless navigation between Messages and Tasks
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => setCurrentView('messages')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentView === 'messages'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Messages Tab
                </button>
                <button
                    onClick={() => setCurrentView('tasks')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentView === 'tasks'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Tasks Tab
                </button>
            </div>

            {/* Content */}
            <div className="transition-all duration-300">
                {currentView === 'messages' ? <MessageView /> : <TaskView />}
            </div>

            {/* Navigation Flow Diagram */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Navigation Flow
                </h3>
                <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">Messages</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-500">View Task</span>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                            <CheckSquare className="w-8 h-8 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">Tasks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-500">Jump to Message</span>
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BidirectionalLinkingDemo; 