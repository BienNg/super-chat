import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical } from 'lucide-react';

/**
 * ActionsDropdown - A reusable dropdown menu component for action buttons
 * 
 * @param {Object} props
 * @param {string} props.itemId - Unique identifier for the item this dropdown belongs to
 * @param {Array} props.actions - Array of action objects with structure: 
 *   { 
 *     key: 'unique-key', 
 *     label: 'Action Label', 
 *     icon: ReactComponent, 
 *     onClick: (item) => {}, 
 *     disabled?: boolean,
 *     loading?: boolean,
 *     className?: string,
 *     isDanger?: boolean 
 *   }
 * @param {Object} props.item - The data item this dropdown is for (passed to action handlers)
 * @param {boolean} props.disabled - Whether the dropdown trigger is disabled
 * @param {string} props.className - Additional CSS classes for the dropdown container
 * @param {number} props.dropdownWidth - Width of dropdown in rem units (default: 12rem)
 * @param {boolean} props.showSeparators - Whether to show separators between action groups
 */
const ActionsDropdown = ({ 
  itemId, 
  actions = [], 
  item, 
  disabled = false, 
  className = '',
  dropdownWidth = 12, // 12rem = 192px
  showSeparators = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, position: 'bottom' });
  const buttonRef = useRef(null);

  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;
    
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = Math.max(actions.length * 40 + 16, 100); // Approximate dropdown height
    const dropdownWidthPx = dropdownWidth * 16; // Convert rem to pixels (assuming 16px = 1rem)
    
    // Calculate optimal position
    let top = rect.bottom + 4; // 4px margin below button
    let left = rect.right - dropdownWidthPx; // Align right edge with button
    let position = 'bottom';
    
    // If dropdown would go below viewport, position above
    if (rect.bottom + dropdownHeight + 8 > viewportHeight) {
      top = rect.top - dropdownHeight - 4; // 4px margin above button
      position = 'top';
    }
    
    // If dropdown would go off left edge, align left edge with button
    if (left < 8) {
      left = rect.left;
    }
    
    // If dropdown would go off right edge, align right edge with viewport
    if (left + dropdownWidthPx > viewportWidth - 8) {
      left = viewportWidth - dropdownWidthPx - 8;
    }
    
    setDropdownPosition({ top, left, position });
  };

  const handleDropdownToggle = (e) => {
    e.stopPropagation(); // Prevent parent element click events
    
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    
    updateDropdownPosition();
    setIsOpen(true);
  };

  const handleActionClick = (action, e) => {
    e.stopPropagation(); // Prevent parent element click events
    setIsOpen(false); // Close dropdown
    
    if (action.onClick && !action.disabled) {
      action.onClick(item, e);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        // Also check if click is inside the dropdown portal
        const dropdownElement = document.querySelector('[data-actions-dropdown-portal]');
        if (!dropdownElement || !dropdownElement.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
      window.addEventListener('resize', handleResize);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  // Group actions by separators
  const groupedActions = showSeparators 
    ? actions.reduce((groups, action, index) => {
        if (action.separator && groups.length > 0) {
          groups.push({ type: 'separator' });
        }
        groups.push(action);
        return groups;
      }, [])
    : actions;

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={handleDropdownToggle}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
          disabled={disabled}
          title="More actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      
      {/* Dropdown Menu - Rendered as Portal */}
      {isOpen && ReactDOM.createPortal(
        <div 
          data-actions-dropdown-portal
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: `${dropdownWidth}rem`,
            minWidth: '180px'
          }}
        >
          <div className="py-1">
            {groupedActions.map((action, index) => {
              // Render separator
              if (action.type === 'separator') {
                return (
                  <div key={`separator-${index}`} className="border-t border-gray-100 my-1"></div>
                );
              }

              // Determine button styling
              const baseClasses = "w-full px-4 py-2 text-left text-sm flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500";
              const normalClasses = "text-gray-700 hover:bg-gray-50";
              const dangerClasses = "text-red-600 hover:bg-red-50";
              const disabledClasses = "text-gray-400 cursor-not-allowed";
              
              let buttonClasses = baseClasses;
              if (action.disabled) {
                buttonClasses += ` ${disabledClasses}`;
              } else if (action.isDanger) {
                buttonClasses += ` ${dangerClasses}`;
              } else {
                buttonClasses += ` ${normalClasses}`;
              }
              
              if (action.className) {
                buttonClasses += ` ${action.className}`;
              }

              return (
                <button
                  key={action.key}
                  onClick={(e) => handleActionClick(action, e)}
                  className={buttonClasses}
                  disabled={action.disabled}
                  title={action.title}
                >
                  {action.loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                      {action.loadingLabel || action.label}
                    </>
                  ) : (
                    <>
                      {action.icon && <action.icon className="h-4 w-4 mr-3 flex-shrink-0" />}
                      {action.label}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ActionsDropdown; 