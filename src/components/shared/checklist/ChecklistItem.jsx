import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Circle, Zap, Edit2 } from 'lucide-react';

/**
 * ChecklistItem - Reusable component for individual checklist items
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the checklist item
 * @param {string} props.title - Title text of the checklist item
 * @param {boolean} props.completed - Whether the item is completed
 * @param {boolean} props.automated - Whether the item is automated
 * @param {function} props.onStatusChange - Callback when status changes
 * @param {function} props.onStartClick - Callback when start button is clicked
 * @param {function} props.onTitleChange - Callback when title is edited
 */
export const ChecklistItem = ({ 
  id, 
  title = 'Task item', 
  completed = false, 
  automated = false,
  onStatusChange,
  onStartClick,
  onTitleChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef(null);

  // When entering edit mode, focus the input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Update edit value when title changes externally
  useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleCheckClick = (e) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(id, !completed);
    }
  };

  const handleStartClick = (e) => {
    e.stopPropagation();
    if (onStartClick) {
      onStartClick(id);
    }
  };
  
  const handleRowClick = (e) => {
    if (!completed && !automated && !isEditing) {
      setIsEditing(true);
    }
  };
  
  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };
  
  const handleInputBlur = () => {
    saveChanges();
  };
  
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveChanges();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };
  
  const saveChanges = () => {
    if (editValue.trim() && editValue !== title) {
      if (onTitleChange) {
        onTitleChange(id, editValue);
      }
    } else {
      setEditValue(title);
    }
    setIsEditing(false);
  };
  
  const cancelEdit = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const StatusIcon = completed ? CheckCircle2 : automated ? Zap : Circle;

  return (
    <div 
      className={`flex items-center p-2 group/item hover:bg-gray-50 rounded-lg transition-colors ${!completed && !automated ? 'cursor-pointer' : ''}`}
      onClick={handleRowClick}
    >
      <div className="flex-shrink-0 mr-3">
        <div 
          onClick={handleCheckClick}
          className="cursor-pointer"
        >
          <StatusIcon 
            className={`w-5 h-5 ${
              completed 
                ? 'text-green-500' 
                : automated 
                  ? 'text-indigo-500' 
                  : 'text-gray-300'
            }`} 
          />
        </div>
      </div>
      <div className="flex-grow">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm py-1 px-0 focus:outline-none text-gray-700"
            value={editValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`text-sm ${completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
            {title}
          </span>
        )}
      </div>
      <div className="flex-shrink-0 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
        {!automated && !completed && !isEditing && (
          <button 
            onClick={handleStartClick}
            className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}; 