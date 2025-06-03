import React, { useState, useEffect, useMemo } from 'react';
import { Check, Clock, CheckCheck, AlertCircle, Search, Filter, Plus, ListFilter, Tag, Calendar, CheckCircle, Circle, ArrowUpDown, ChevronDown, Users } from 'lucide-react';
import TaskList from './TaskList';
import TaskDetails from './TaskDetails';
import { useTasks } from '../../../hooks/useTasks';

const TaskTab = ({ channelId, selectedTaskId, onTaskSelect, onJumpToMessage }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'completed'
    const [sortBy, setSortBy] = useState('lastActivity'); // 'lastActivity', 'createdAt'
    const [showFilters, setShowFilters] = useState(false);
    
    // Use real useTasks hook
    const { 
        tasks, 
        loading, 
        error, 
        markTaskComplete, 
        deleteTask 
    } = useTasks(channelId);

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        
        return tasks
            .filter(task => {
                // Status filter
                if (statusFilter !== 'all' && task.status !== statusFilter) {
                    return false;
                }
                
                // Search filter
                if (searchQuery) {
                    const content = task.sourceMessageData?.content?.toLowerCase() || '';
                    const sender = task.sourceMessageData?.sender?.displayName?.toLowerCase() || '';
                    return content.includes(searchQuery.toLowerCase()) || 
                           sender.includes(searchQuery.toLowerCase());
                }
                
                return true;
            })
            .sort((a, b) => {
                // Sort by selected criteria
                const aDate = a[sortBy]?.toDate ? a[sortBy].toDate() : new Date(a[sortBy] || 0);
                const bDate = b[sortBy]?.toDate ? b[sortBy].toDate() : new Date(b[sortBy] || 0);
                return bDate - aDate; // Newest first
            });
    }, [tasks, searchQuery, statusFilter, sortBy]);

    // Update selected task when selectedTaskId prop changes
    useEffect(() => {
        if (selectedTaskId && tasks.length > 0) {
            const task = tasks.find(t => t.id === selectedTaskId);
            setSelectedTask(task || null);
        } else {
            setSelectedTask(null);
        }
    }, [selectedTaskId, tasks]);

    const handleTaskSelect = (task) => {
        setSelectedTask(task);
        // Notify parent component to update URL
        if (onTaskSelect && task) {
            onTaskSelect(task.id);
        }
    };

    const handleTaskComplete = async (taskId) => {
        try {
            await markTaskComplete(taskId);
            // If the completed task was selected, clear selection
            if (selectedTask?.id === taskId) {
                setSelectedTask(null);
                // Navigate back to tasks list
                if (onTaskSelect) {
                    onTaskSelect(null);
                }
            }
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const handleTaskDelete = async (taskId) => {
        try {
            await deleteTask(taskId);
            // If the deleted task was selected, clear selection
            if (selectedTask?.id === taskId) {
                setSelectedTask(null);
                // Navigate back to tasks list
                if (onTaskSelect) {
                    onTaskSelect(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-6"></div>
                    <p className="text-gray-600 font-medium">Loading your tasks...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">Error loading tasks</p>
                    <p className="text-sm text-gray-600">{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50">
            <div className="flex h-full min-h-0">
                {/* Left Panel - Tasks List */}
                <div className="w-[40%] bg-white shadow-sm flex flex-col min-h-0 max-w-[50vw] border-r border-gray-200">
                    {/* Header with search and filters */}
                    <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Tasks</h3>
                            <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {filteredTasks.filter(t => t.status === 'active').length} active
                                </span>
                                <button 
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                    title="Toggle filters"
                                >
                                    <Filter className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Search bar */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 focus:outline-none transition-colors text-sm"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        {/* Filters */}
                        {showFilters && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3 animate-fadeIn">
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                                        <Tag className="h-3 w-3 mr-1" /> Status
                                    </label>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                                statusFilter === 'all' 
                                                    ? 'bg-indigo-100 text-indigo-800' 
                                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('active')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center ${
                                                statusFilter === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Circle className="h-3 w-3 mr-1" /> Active
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('completed')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center ${
                                                statusFilter === 'completed' 
                                                    ? 'bg-gray-200 text-gray-800' 
                                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <CheckCircle className="h-3 w-3 mr-1" /> Completed
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center">
                                        <ArrowUpDown className="h-3 w-3 mr-1" /> Sort by
                                    </label>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setSortBy('lastActivity')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                                sortBy === 'lastActivity' 
                                                    ? 'bg-indigo-100 text-indigo-800' 
                                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            Last activity
                                        </button>
                                        <button
                                            onClick={() => setSortBy('createdAt')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                                sortBy === 'createdAt' 
                                                    ? 'bg-indigo-100 text-indigo-800' 
                                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            Creation date
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Tasks list */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <TaskList 
                            tasks={filteredTasks}
                            selectedTask={selectedTask}
                            onTaskSelect={handleTaskSelect}
                            channelId={channelId}
                        />
                    </div>
                </div>

                {/* Right Panel - Task Details */}
                <div className="w-[60%] flex flex-col min-h-0 max-w-[60vw] bg-white">
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <TaskDetails 
                            task={selectedTask}
                            channelId={channelId}
                            onTaskUpdate={handleTaskSelect}
                            onJumpToMessage={onJumpToMessage}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskTab; 