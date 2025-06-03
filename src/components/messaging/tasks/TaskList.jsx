import React from 'react';
import TaskCard from './TaskCard';
import TaskListEmpty from './TaskListEmpty';

const TaskList = ({ tasks, selectedTask, onTaskSelect, channelId }) => {
    if (!tasks || tasks.length === 0) {
        return <TaskListEmpty onCreateTask={() => {/* TODO: Implement create task */}} />;
    }

    return (
        <div className="overflow-y-auto h-full p-4 space-y-4">
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTask?.id === task.id}
                    onSelect={() => onTaskSelect(task)}
                    channelId={channelId}
                />
            ))}
        </div>
    );
};

export default TaskList; 