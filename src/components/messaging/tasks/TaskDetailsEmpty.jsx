import React from 'react';
import { Clipboard } from 'lucide-react';

const TaskDetailsEmpty = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clipboard className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a task</h3>
            <p className="text-gray-500 max-w-sm">
                Choose a task from the left panel to view its details and updates.
            </p>
        </div>
    );
};

export default TaskDetailsEmpty; 