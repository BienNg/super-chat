import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import ManagerFirebaseDashboard from '../components/shared/ManagerFirebaseDashboard';
import ProtectedComponent from '../components/shared/ProtectedComponent';

// Create a new context
const AdvancedSupabaseMonitorContext = createContext({});

// Operations storage
const operationsLog = [];
let totalOperations = 0;
let totalReads = 0;
let totalWrites = 0;
let startTime = null;

// Custom hook to use the context
export const useAdvancedSupabaseMonitor = () => useContext(AdvancedSupabaseMonitorContext);

// Create a wrapper to intercept and log Supabase operations
const trackSupabaseOperations = () => {
  // Save original methods we want to track
  const originalSelect = supabase.from;
  const originalRpc = supabase.rpc;
  const originalStorage = supabase.storage;
  
  // Track operations start time
  startTime = new Date();

  // Wrap Supabase query builder to track operations
  supabase.from = function(...args) {
    const queryBuilder = originalSelect.apply(this, args);
    const table = args[0];
    
    // Create wrapped functions to track
    const originalFunctions = {
      select: queryBuilder.select,
      insert: queryBuilder.insert,
      update: queryBuilder.update,
      upsert: queryBuilder.upsert,
      delete: queryBuilder.delete,
    };

    // Wrap select (read operation)
    queryBuilder.select = function(...selectArgs) {
      const operation = {
        id: ++totalOperations,
        type: 'read',
        method: 'select',
        table,
        timestamp: new Date(),
        args: selectArgs
      };
      operationsLog.unshift(operation);
      if (operationsLog.length > 200) operationsLog.pop();
      totalReads++;
      return originalFunctions.select.apply(this, selectArgs);
    };
    
    // Wrap insert (write operation)
    queryBuilder.insert = function(...insertArgs) {
      const operation = {
        id: ++totalOperations,
        type: 'write',
        method: 'insert',
        table,
        timestamp: new Date(),
        args: insertArgs
      };
      operationsLog.unshift(operation);
      if (operationsLog.length > 200) operationsLog.pop();
      totalWrites++;
      return originalFunctions.insert.apply(this, insertArgs);
    };
    
    // Wrap update (write operation)
    queryBuilder.update = function(...updateArgs) {
      const operation = {
        id: ++totalOperations,
        type: 'write',
        method: 'update',
        table,
        timestamp: new Date(),
        args: updateArgs
      };
      operationsLog.unshift(operation);
      if (operationsLog.length > 200) operationsLog.pop();
      totalWrites++;
      return originalFunctions.update.apply(this, updateArgs);
    };
    
    // Wrap delete (write operation)
    queryBuilder.delete = function(...deleteArgs) {
      const operation = {
        id: ++totalOperations,
        type: 'write',
        method: 'delete',
        table,
        timestamp: new Date(),
        args: deleteArgs
      };
      operationsLog.unshift(operation);
      if (operationsLog.length > 200) operationsLog.pop();
      totalWrites++;
      return originalFunctions.delete.apply(this, deleteArgs);
    };
    
    // Wrap upsert (write operation)
    queryBuilder.upsert = function(...upsertArgs) {
      const operation = {
        id: ++totalOperations,
        type: 'write',
        method: 'upsert',
        table,
        timestamp: new Date(),
        args: upsertArgs
      };
      operationsLog.unshift(operation);
      if (operationsLog.length > 200) operationsLog.pop();
      totalWrites++;
      return originalFunctions.upsert.apply(this, upsertArgs);
    };
    
    return queryBuilder;
  };
  
  return () => {
    // Restore original methods when cleaning up
    supabase.from = originalSelect;
    supabase.rpc = originalRpc;
    supabase.storage = originalStorage;
  };
};

// Get stats from the operation log
const getStats = () => {
  const now = new Date();
  const sessionDuration = startTime ? (now - startTime) / 1000 : 0; // in seconds
  
  // Calculate operations in the last 5 minutes
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
  const recentOps = operationsLog.filter(op => op.timestamp >= fiveMinutesAgo);
  const recentReads = recentOps.filter(op => op.type === 'read').length;
  const recentWrites = recentOps.filter(op => op.type === 'write').length;
  
  const readsPerMinute = sessionDuration > 0 ? Math.round((recentReads / 5) * 10) / 10 : 0;
  const writesPerMinute = sessionDuration > 0 ? Math.round((recentWrites / 5) * 10) / 10 : 0;
  
  // Generate alerts
  const alerts = [];
  if (readsPerMinute > 30) {
    alerts.push({
      type: 'warning',
      message: 'High read rate detected',
      details: `${readsPerMinute} reads/minute in the last 5 minutes`
    });
  }
  
  if (writesPerMinute > 15) {
    alerts.push({
      type: 'warning',
      message: 'High write rate detected',
      details: `${writesPerMinute} writes/minute in the last 5 minutes`
    });
  }
  
  return {
    session: {
      totalOperations,
      totalReads,
      totalWrites,
      duration: Math.round(sessionDuration),
      startTime
    },
    last5min: {
      operations: recentOps.length,
      reads: recentReads,
      writes: recentWrites,
      readsPerMinute,
      writesPerMinute
    },
    alerts
  };
};

// Get recent operations
const getRecentOperations = (count = 50) => {
  return operationsLog.slice(0, count);
};

// Provider component
export const AdvancedSupabaseMonitorProvider = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [currentStats, setCurrentStats] = useState(null);
  const [recentOperations, setRecentOperations] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize tracking on mount
  useEffect(() => {
    if (!isInitialized) {
      const cleanup = trackSupabaseOperations();
      setIsTracking(true);
      setIsInitialized(true);
      
      // Update stats once initially
      setTimeout(updateStats, 1000);
      
      return cleanup;
    }
  }, [isInitialized]);

  // Update statistics
  const updateStats = useCallback(() => {
    try {
      const stats = getStats();
      const operations = getRecentOperations(50);
      
      setCurrentStats(stats);
      setRecentOperations(operations);
    } catch (error) {
      console.error('Failed to update Supabase monitor stats:', error);
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
    a.download = `supabase-session-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📊 Supabase Monitor: Session data exported');
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
      writes: session.totalWrites,
      readsPerMinute: last5min.readsPerMinute
    };
  }, [currentStats]);

  // Auto-refresh stats every 10 seconds when dashboard is visible
  useEffect(() => {
    if (!isDashboardVisible || !isTracking) return;

    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, [isDashboardVisible, isTracking, updateStats]);

  // Context value
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
    exportSessionData
  };

  return (
    <AdvancedSupabaseMonitorContext.Provider value={contextValue}>
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
    </AdvancedSupabaseMonitorContext.Provider>
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
  } = useAdvancedSupabaseMonitor();

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
    exportSessionData
  } = useAdvancedSupabaseMonitor();

  return {
    isTracking,
    stats: currentStats,
    operations: recentOperations,
    refreshStats: updateStats,
    exportSessionData
  };
}; 