import React, { useRef, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ChecklistItem } from './ChecklistItem';
import { getEmptyImage } from 'react-dnd-html5-backend';
import './animations.css';

const ITEM_TYPE = 'checklist-item';

/**
 * DraggableItem - Wraps ChecklistItem with drag and drop functionality
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the checklist item
 * @param {string} props.title - Title text of the checklist item
 * @param {boolean} props.completed - Whether the item is completed
 * @param {boolean} props.automated - Whether the item is automated
 * @param {number} props.index - The item's position in the list
 * @param {function} props.onStatusChange - Callback when status changes
 * @param {function} props.onStartClick - Callback when start button is clicked
 * @param {function} props.moveItem - Callback for reordering items
 * @param {boolean} props.animating - Whether the entire list is animating
 * @param {function} props.onTitleChange - Callback when title is edited
 */
export const DraggableItem = ({ 
  id, 
  title, 
  completed, 
  automated, 
  index,
  onStatusChange, 
  onStartClick,
  moveItem,
  animating = false,
  onTitleChange
}) => {
  const ref = useRef(null);
  const [isDropping, setIsDropping] = useState(false);
  const [dropTarget, setDropTarget] = useState(null);
  const [dragDirection, setDragDirection] = useState(null);
  const [isDragEnded, setIsDragEnded] = useState(false);
  const [initialDrag, setInitialDrag] = useState(false);
  const [hasRecentlyMoved, setHasRecentlyMoved] = useState(false);
  const [moveDirection, setMoveDirection] = useState(null); // 'up' or 'down'
  const prevIndexRef = useRef(index);

  // Track index changes to detect passive movement
  useEffect(() => {
    if (prevIndexRef.current !== index && prevIndexRef.current !== null) {
      // Item has been passively moved (it wasn't the one being dragged)
      setHasRecentlyMoved(true);
      
      // Determine direction of movement
      const direction = prevIndexRef.current > index ? 'up' : 'down';
      setMoveDirection(direction);
      
      // Reset animation states after animation completes
      const timer = setTimeout(() => {
        setHasRecentlyMoved(false);
        setMoveDirection(null);
      }, 600);
      
      return () => clearTimeout(timer);
    }
    prevIndexRef.current = index;
  }, [index]);

  // Set up the drag hook
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: (monitor) => {
      setInitialDrag(true);
      // Simulate initial lift animation
      setTimeout(() => setInitialDrag(false), 150);
      return { id, index, title, completed, automated };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      
      if (didDrop) {
        // Dropped successfully - show settle animation
        setIsDragEnded(true);
        setTimeout(() => setIsDragEnded(false), 300);
      }
      
      setIsDropping(false);
      setDropTarget(null);
      setDragDirection(null);
    }
  });

  // Use empty image as drag preview (we'll create our own custom preview)
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Set up the drop hook
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        setIsDropping(false);
        setDropTarget(null);
        return;
      }

      // Get the rectangle of the current item
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get the vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Get the mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get the pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Determine drag direction
      const direction = dragIndex < hoverIndex ? 'down' : 'up';
      setDragDirection(direction);
      
      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        setIsDropping(false);
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        setIsDropping(false);
        return;
      }

      // Set the drop target for animation
      setDropTarget(hoverIndex);
      setIsDropping(true);

      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Connect the drag and drop refs
  drag(drop(ref));

  // Calculate animation styles
  const getItemStyle = () => {
    // If the whole list is animating
    if (animating) {
      return {
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        willChange: 'transform, opacity',
      };
    }

    // Initial drag lift effect
    if (initialDrag) {
      return {
        transform: 'scale(1.02) translateY(-2px)',
        boxShadow: '0 5px 10px rgba(0, 0, 0, 0.1)',
        opacity: 0.8,
        transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease, box-shadow 0.15s ease',
        zIndex: 10,
        willChange: 'transform, opacity, box-shadow',
      };
    }
    
    // When item is being dragged
    if (isDragging) {
      return {
        opacity: 0.3,
        transform: 'scale(0.98)',
        boxShadow: 'none',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        willChange: 'transform, opacity',
      };
    }
    
    // When an item is in the drop zone
    if (isOver && dropTarget === index) {
      const shift = dragDirection === 'down' ? '10px' : '-10px';
      return {
        transform: `translateY(${shift})`,
        boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
        transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease',
        zIndex: 5,
        willChange: 'transform, box-shadow',
      };
    }
    
    // Animation when item is dropped
    if (isDragEnded) {
      return {
        transform: 'translateY(0) scale(1.02)',
        boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 1,
        willChange: 'transform, box-shadow',
      };
    }
    
    // Default state
    return {
      transform: 'translateY(0) scale(1)',
      transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      zIndex: 0,
    };
  };

  // Generate CSS classes for animations
  const getAnimationClasses = () => {
    const classes = ['draggable-item'];
    
    if (isDragging) classes.push('dragging');
    if (isDropping && dropTarget === index) classes.push('drop-target');
    if (isDragEnded) classes.push('reorder-complete');
    
    if (hasRecentlyMoved) {
      classes.push('passive-move-animation');
      if (moveDirection === 'up') classes.push('moved-up-no-flash');
      if (moveDirection === 'down') classes.push('moved-down-no-flash');
    }
    
    return classes.join(' ');
  };

  // Don't allow editing while being dragged
  const handleTitleChange = (itemId, newTitle) => {
    if (!isDragging && onTitleChange) {
      onTitleChange(itemId, newTitle);
    }
  };

  return (
    <div 
      ref={ref} 
      className={`relative group ${getAnimationClasses()}`}
      style={getItemStyle()}
    >
      <div 
        className={`
          ${isDropping && dropTarget === index ? 'border-2 border-indigo-200 rounded-lg' : ''}
          transition-all duration-200 group-hover:bg-indigo-50 rounded-lg group-hover:shadow-sm
        `}
      >
        <ChecklistItem
          id={id}
          title={title}
          completed={completed}
          automated={automated}
          onStatusChange={onStatusChange}
          onStartClick={onStartClick}
          onTitleChange={handleTitleChange}
        />
      </div>
      
      {/* Handle for dragging - visible on hover */}
      <div className="drag-handle"></div>
    </div>
  );
}; 