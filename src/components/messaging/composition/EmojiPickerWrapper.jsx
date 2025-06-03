import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker from './EmojiPicker';

const EmojiPickerWrapper = ({ onEmojiSelect, onClose, className = '', triggerRef }) => {
  const wrapperRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom-left' });

  useEffect(() => {
    if (!triggerRef?.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Calculate available space
      const spaceAbove = triggerRect.top;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewportWidth - triggerRect.right;

      // Determine vertical position
      const pickerHeight = 400; // max height of emoji picker
      const shouldShowAbove = spaceBelow < pickerHeight && spaceAbove > spaceBelow;

      // Determine horizontal position
      const pickerWidth = 380; // width of emoji picker
      const shouldShowRight = spaceLeft < pickerWidth && spaceRight > spaceLeft;

      // Calculate absolute position
      let top, left;
      let placement = '';

      if (shouldShowAbove) {
        top = triggerRect.top - pickerHeight - 8; // 8px gap
        placement = 'top';
      } else {
        top = triggerRect.bottom + 8; // 8px gap
        placement = 'bottom';
      }

      if (shouldShowRight) {
        left = triggerRect.right - pickerWidth;
        placement += '-right';
      } else {
        left = triggerRect.left;
        placement += '-left';
      }

      // Ensure picker stays within viewport bounds
      const padding = 16;
      top = Math.max(padding, Math.min(top, viewportHeight - pickerHeight - padding));
      left = Math.max(padding, Math.min(left, viewportWidth - pickerWidth - padding));

      setPosition({ top, left, placement });
    };

    // Update position on mount and scroll/resize
    updatePosition();
    
    const handleUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [triggerRef]);

  // Handle clicks outside to close picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target) && 
          triggerRef?.current && !triggerRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Render picker as portal to avoid z-index issues
  return createPortal(
    <div 
      ref={wrapperRef}
      className="fixed z-[9999]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <EmojiPicker
        onEmojiSelect={onEmojiSelect}
        onClose={onClose}
        className={className}
      />
    </div>,
    document.body
  );
};

export default EmojiPickerWrapper; 