import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import firebaseTracker, { startTracking, stopTracking, getStats, getRecentOperations } from '../utils/comprehensiveFirebaseTracker';
import ManagerFirebaseDashboard from '../components/shared/ManagerFirebaseDashboard';
import ProtectedComponent from '../components/shared/ProtectedComponent';

const AdvancedFirebaseMonitorContext = createContext({});

export const useAdvancedFirebaseMonitor = () => useContext(AdvancedFirebaseMonitorContext);

export const AdvancedFirebaseMonitorProvider = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [currentStats, setCurrentStats] = useState(null);
  const [recentOperations, setRecentOperations] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize tracking on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeTracking();
      setIsInitialized(true);
    }

    // Cleanup on unmount
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  // Initialize comprehensive tracking
  const initializeTracking = useCallback(() => {
    try {
      startTracking((operation) => {
        // Update recent operations
        setRecentOperations(prev => {
          const updated = [operation, ...prev].slice(0, 100); // Keep last 100 operations
          return updated;
        });

        // Update stats every few operations for performance
        if (operation.id % 5 === 0) {
          updateStats();
        }
      });

      setIsTracking(true);
      console.log('✅ Advanced Firebase Monitor: Tracking initialized');

      // Initial stats update
      setTimeout(updateStats, 1000);

    } catch (error) {
      console.error('❌ Advanced Firebase Monitor: Failed to initialize', error);
    }
  }, []);

  // Update statistics
  const updateStats = useCallback(() => {
    try {
      const stats = getStats();
      const operations = getRecentOperations(50);
      
      setCurrentStats(stats);
      setRecentOperations(operations);
    } catch (error) {
      console.error('❌ Advanced Firebase Monitor: Failed to update stats', error);
    }
  }, []);

  // Toggle dashboard visibility
  const toggleDashboard = useCallback(() => {
    setIsDashboardVisible(prev => !prev);
    
    // Update stats when opening dashboard
    if (!isDashboardVisible) {
      updateStats();
    }
  }, [isDashboardVisible, updateStats]);

  // Get current session summary
  const getSessionSummary = useCallback(() => {
    if (!currentStats) return null;

    const { session, last5min, alerts } = currentStats;
    
    return {
      totalOperations: session.totalOperations,
      totalReads: session.totalReads,
      totalWrites: session.totalWrites,
      totalCost: session.totalCost,
      readsPerMinute: last5min.readsPerMinute,
      hasAlerts: alerts.length > 0,
      criticalAlerts: alerts.filter(a => a.type === 'warning').length,
      sessionDuration: session.duration
    };
  }, [currentStats]);

  // Export session data
  const exportSessionData = useCallback(() => {
    if (!currentStats || !recentOperations) {
      console.warn('No data available for export');
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      sessionSummary: getSessionSummary(),
      detailedStats: currentStats,
      recentOperations: recentOperations,
      metadata: {
        exportedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase-session-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📊 Firebase Monitor: Session data exported');
  }, [currentStats, recentOperations, getSessionSummary]);

  // Check if monitoring should show alert badge
  const shouldShowAlert = useCallback(() => {
    if (!currentStats) return false;
    
    const { alerts, last5min } = currentStats;
    
    // Show alert if there are warnings or high activity
    return alerts.some(a => a.type === 'warning') || last5min.readsPerMinute > 30;
  }, [currentStats]);

  // Get quick status for minimal UI
  const getQuickStatus = useCallback(() => {
    if (!currentStats) {
      return {
        status: 'Loading...',
        color: 'gray',
        reads: 0,
        cost: 0
      };
    }

    const { session, last5min, alerts } = currentStats;
    const hasWarnings = alerts.some(a => a.type === 'warning');
    
    let status = 'Normal';
    let color = 'green';
    
    if (hasWarnings || last5min.readsPerMinute > 50) {
      status = 'High Activity';
      color = 'orange';
    } else if (last5min.readsPerMinute > 20) {
      status = 'Active';
      color = 'blue';
    }

    return {
      status,
      color,
      reads: session.totalReads,
      cost: session.totalCost,
      readsPerMinute: last5min.readsPerMinute
    };
  }, [currentStats]);

  // Auto-refresh stats every 10 seconds when dashboard is visible
  useEffect(() => {
    if (!isDashboardVisible || !isTracking) return;

    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, [isDashboardVisible, isTracking, updateStats]);

  // Manager-friendly context value
  const contextValue = {
    // Tracking state
    isTracking,
    isInitialized,
    
    // Dashboard state
    isDashboardVisible,
    toggleDashboard,
    
    // Data
    currentStats,
    recentOperations,
    
    // Quick access functions
    getSessionSummary,
    getQuickStatus,
    shouldShowAlert,
    
    // Actions
    updateStats,
    exportSessionData,
    
    // Direct tracker access (for advanced users)
    tracker: firebaseTracker
  };

  return (
    <AdvancedFirebaseMonitorContext.Provider value={contextValue}>
      {children}
      
      {/* Render the manager dashboard - ONLY for admins */}
      <ProtectedComponent roles={['admin']}>
        <ManagerFirebaseDashboard
          stats={currentStats}
          recentOperations={recentOperations}
          isVisible={isDashboardVisible}
          onToggle={toggleDashboard}
        />
      </ProtectedComponent>
    </AdvancedFirebaseMonitorContext.Provider>
  );
};

// Hook for managers who don't need technical details
export const useManagerDashboard = () => {
  const {
    isDashboardVisible,
    toggleDashboard,
    getSessionSummary,
    getQuickStatus,
    shouldShowAlert,
    exportSessionData
  } = useAdvancedFirebaseMonitor();

  return {
    isDashboardVisible,
    toggleDashboard,
    sessionSummary: getSessionSummary(),
    quickStatus: getQuickStatus(),
    hasAlerts: shouldShowAlert(),
    exportSessionData
  };
};

// Hook for developers who need technical access
export const useDeveloperMonitor = () => {
  const {
    isTracking,
    currentStats,
    recentOperations,
    updateStats,
    tracker
  } = useAdvancedFirebaseMonitor();

  return {
    isTracking,
    stats: currentStats,
    operations: recentOperations,
    refresh: updateStats,
    tracker
  };
}; 