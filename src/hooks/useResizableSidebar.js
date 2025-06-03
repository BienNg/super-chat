import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useResizableSidebar - Custom hook for managing resizable sidebar functionality
 * Provides drag-to-resize capability with min/max width constraints
 */
export const useResizableSidebar = (initialWidth = 256, minWidth = 200, maxWidth = 400) => {
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    
    // Add cursor style and prevent text selection
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
  }, [sidebarWidth]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + deltaX;
    
    // Constrain width within min/max bounds
    const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
    setSidebarWidth(constrainedWidth);
  }, [isResizing, minWidth, maxWidth]);

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    
    setIsResizing(false);
    
    // Remove cursor style and restore text selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('resizing');
  }, [isResizing]);

  // Add/remove global event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Persist sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('chatter-sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Load sidebar width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('chatter-sidebar-width');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= minWidth && width <= maxWidth) {
        setSidebarWidth(width);
      }
    }
  }, [minWidth, maxWidth]);

  return {
    sidebarWidth,
    isResizing,
    handleMouseDown,
    setSidebarWidth
  };
}; 