import React from 'react';
import { useDragLayer } from 'react-dnd';
import { CheckCircle2, Circle, Zap } from 'lucide-react';

/**
 * CustomDragLayer - Creates a custom preview for dragged items
 */
export const CustomDragLayer = () => {
  const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  // Calculate position and transform for the drag preview
  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;

  // Calculate rotation based on movement speed
  const getRotation = () => {
    if (!initialOffset) return 0;
    
    // Calculate horizontal movement (slight rotation for side movement)
    const xDiff = x - initialOffset.x;
    const rotation = Math.min(Math.max(xDiff * 0.05, -3), 3); // Limit rotation to ±3 degrees
    
    return rotation;
  };

  // Calculate shadow based on "height"
  const getShadow = () => {
    // Calculate vertical movement (shadow grows with height)
    const yDiff = initialOffset ? Math.max(0, initialOffset.y - y) : 0;
    const elevation = Math.min(yDiff * 0.1, 20); // Limit to 20px
    
    return `0 ${elevation}px ${elevation * 1.5}px rgba(0, 0, 0, 0.15)`;
  };

  // Determine appropriate icon for task status
  const TaskIcon = item.completed ? CheckCircle2 : item.automated ? Zap : Circle;

  return (
    <div className="fixed top-0 left-0 z-50 pointer-events-none" style={{ transform }}>
      <div 
        className="bg-white border border-indigo-200 rounded-lg p-3 w-72 transition-transform"
        style={{
          boxShadow: getShadow(),
          transform: `rotate(${getRotation()}deg) scale(1.02)`,
          transition: 'box-shadow 0.1s ease',
          opacity: 0.9,
        }}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <TaskIcon 
              className={`w-5 h-5 ${
                item.completed 
                  ? 'text-green-500' 
                  : item.automated 
                    ? 'text-indigo-500' 
                    : 'text-gray-300'
              }`} 
            />
          </div>
          <div className="flex-grow">
            <span className="text-sm font-medium text-gray-800">{item.title}</span>
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-b-lg"></div>
      </div>
    </div>
  );
}; 