import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, Timer, Circle, Plus, Edit2 } from 'lucide-react';
import { ChecklistItem } from './ChecklistItem';
import { DraggableItem } from './DraggableItem';

/**
 * ChecklistStage - Reusable component for checklist stages with timeline visualization
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the stage
 * @param {string} props.title - Title of the stage
 * @param {React.Component} props.icon - Icon component for the stage
 * @param {string} props.color - Color class for the stage (e.g., 'bg-blue-500')
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {Array} props.tasks - Array of task objects
 * @param {function} props.onTaskStatusChange - Callback when task status changes
 * @param {function} props.onTaskStart - Callback when task start button is clicked
 * @param {function} props.onAddTask - Callback when adding a new task
 * @param {function} props.onReorderTasks - Callback when tasks are reordered
 * @param {function} props.onTitleChange - Callback when stage title is edited
 * @param {function} props.onTaskTitleChange - Callback when task title is edited
 */
export const ChecklistStage = ({ 
  id, 
  title, 
  icon: StageIcon, 
  color, 
  progress = 0, 
  tasks = [], 
  onTaskStatusChange,
  onTaskStart,
  onAddTask,
  onReorderTasks,
  onTitleChange,
  onTaskTitleChange
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [prevTaskIds, setPrevTaskIds] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const titleInputRef = useRef(null);
  const stageRef = useRef(null);
  
  // Keep track of the previous task order to detect changes
  useEffect(() => {
    const currentTaskIds = tasks.map(task => task.id);
    const hasOrderChanged = 
      currentTaskIds.length !== prevTaskIds.length || 
      currentTaskIds.some((id, index) => id !== prevTaskIds[index]);
    
    if (hasOrderChanged && prevTaskIds.length > 0) {
      // Order has changed, trigger animation
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500); // Animation duration
    }
    
    setPrevTaskIds(currentTaskIds);
  }, [tasks]);
  
  // Focus input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);
  
  // Update edit value when title changes externally
  useEffect(() => {
    setEditValue(title);
  }, [title]);
  
  const getStageStatusIcon = () => {
    if (progress === 100) return CheckCircle2;
    if (progress > 0) return Timer;
    return Circle;
  };
  
  const StatusIcon = getStageStatusIcon();

  const handleAddTask = (index) => {
    if (onAddTask) {
      onAddTask(id, index);
    }
  };

  const moveItem = useCallback((dragIndex, hoverIndex) => {
    if (onReorderTasks) {
      onReorderTasks(id, dragIndex, hoverIndex);
    }
  }, [id, onReorderTasks]);

  const handleHeaderClick = () => {
    if (!isEditingTitle) {
      setIsEditingTitle(true);
    }
  };
  
  const handleTitleChange = (e) => {
    setEditValue(e.target.value);
  };
  
  const handleTitleBlur = () => {
    saveTitle();
  };
  
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };
  
  const saveTitle = () => {
    if (editValue.trim() && editValue !== title) {
      if (onTitleChange) {
        onTitleChange(id, editValue);
      }
    } else {
      setEditValue(title);
    }
    setIsEditingTitle(false);
  };
  
  const cancelEdit = () => {
    setEditValue(title);
    setIsEditingTitle(false);
  };
  
  const handleTaskTitleChange = (taskId, newTitle) => {
    if (onTaskTitleChange) {
      onTaskTitleChange(id, taskId, newTitle);
    }
  };

  // Function to get the animation styles for each item
  const getItemStyle = (index) => {
    if (animating) {
      return {
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
      };
    }
    return {};
  };

  return (
    <div className="relative mb-8">
      {/* Stage Node */}
      <div className="absolute left-6 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center"
           style={{ borderColor: color.replace('bg-', '').replace('blue-500', '#3b82f6').replace('indigo-500', '#6366f1').replace('purple-500', '#a855f7').replace('green-500', '#10b981').replace('emerald-500', '#10b981') }}>
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
      </div>
      
      {/* Stage Content */}
      <div className="ml-16 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
        <div 
          className="flex items-start justify-between mb-4 group/stage cursor-pointer"
          onClick={handleHeaderClick}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white`}>
              <StageIcon className="w-5 h-5" />
            </div>
            <div className="relative">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  className="font-semibold text-gray-900 bg-transparent py-1 px-0 focus:outline-none"
                  value={editValue}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  {title}
                  <StatusIcon className={`w-4 h-4 ${progress === 100 ? 'text-green-500' : progress > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
                </h3>
              )}
            </div>
          </div>
        </div>

        {/* Tasks with Add Task Indicators */}
        <div 
          className="space-y-3 relative" 
          onMouseLeave={() => setHoverIndex(null)}
          ref={stageRef}
        >
          <div className="relative">
            {/* Initial add area (top of list) */}
            <div 
              className="absolute w-full h-6 top-0 transform -translate-y-3 z-10 cursor-pointer"
              onMouseEnter={() => setHoverIndex(-1)}
              onClick={() => handleAddTask(0)}
            >
              <div 
                className={`absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                  hoverIndex === -1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <div className="h-6 w-6 bg-indigo-100 hover:bg-indigo-200 rounded-full flex items-center justify-center shadow-sm">
                  <Plus className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className={`transition-all ${animating ? 'will-change-transform' : ''}`}>
              {tasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className="relative mb-3 transition-all"
                  style={getItemStyle(index)}
                >
                  <DraggableItem
                    id={task.id}
                    title={task.title}
                    completed={task.completed}
                    automated={task.automated}
                    index={index}
                    onStatusChange={onTaskStatusChange}
                    onStartClick={onTaskStart}
                    moveItem={moveItem}
                    animating={animating}
                    onTitleChange={handleTaskTitleChange}
                  />
                  
                  {/* Add task area (between items) */}
                  <div 
                    className="absolute w-full h-6 bottom-0 transform translate-y-1/2 z-10 cursor-pointer"
                    onMouseEnter={() => setHoverIndex(index)}
                    onClick={() => handleAddTask(index + 1)}
                  >
                    <div 
                      className={`absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                        hoverIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                      }`}
                    >
                      <div className="h-6 w-6 bg-indigo-100 hover:bg-indigo-200 rounded-full flex items-center justify-center shadow-sm">
                        <Plus className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 