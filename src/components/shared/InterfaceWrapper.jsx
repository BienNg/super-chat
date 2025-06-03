import React, { useEffect } from 'react';

const InterfaceWrapper = ({ children }) => {
  // Initialize any global interface logic here
  useEffect(() => {
    // Any initialization logic can go here
    console.log('Interface initialized');
  }, []);

  return (
    <div className="interface-wrapper">
      {children}
    </div>
  );
};

export default InterfaceWrapper; 