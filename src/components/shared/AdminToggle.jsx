import React, { useEffect } from 'react';

const AdminToggle = () => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Press Option+Shift+A (Alt+Shift+A) to toggle admin mode
      if (event.altKey && event.shiftKey && event.key === 'A') {
        const currentMode = localStorage.getItem('temp_admin_mode') === 'true';
        localStorage.setItem('temp_admin_mode', (!currentMode).toString());
        
        const mode = !currentMode ? 'enabled' : 'disabled';
        
        // Show a temporary notification
        const notification = document.createElement('div');
        notification.textContent = `Admin mode ${mode}. Refresh the page to see changes.`;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${!currentMode ? '#10b981' : '#ef4444'};
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 500;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null; // This component doesn't render anything
};

export default AdminToggle; 