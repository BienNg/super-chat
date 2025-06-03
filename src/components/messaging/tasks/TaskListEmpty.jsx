import React from 'react';
import { CheckCircle } from 'lucide-react';

const TaskListEmpty = ({ onCreateTask }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100%-65px)] p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4 max-w-sm">
                Create tasks by marking messages with the task icon.
            </p>
        </div>
    );
};

export default TaskListEmpty; 