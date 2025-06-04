import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';

const FirebaseLoggerContext = createContext({});

export const useFirebaseLogger = () => useContext(FirebaseLoggerContext);

export const FirebaseLoggerProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const { userProfile, currentUser } = useAuth();
  const userEmailRef = useRef();
  
  // Update ref when user info changes
  userEmailRef.current = userProfile?.email || currentUser?.email || 'Unknown';

  // Stable admin check - now available to all users
  const isAdmin = useMemo(() => {
    // For development/testing: show monitoring for all users
    return true;
    
    // Original admin checks (commented out for now):
    // if (localStorage.getItem('temp_admin_mode') === 'true') return true;
    // if (currentUser?.email === 'admin@example.com') return true;
    // if (userProfile?.roles?.some(role => role.name === 'admin' || role.id === 'admin')) return true;
    // return false;
  }, []);

  // Stable log functions
  const logFirebaseRead = useCallback((collection, docId = null, queryParams = null, resultCount = 0) => {
    const timestamp = new Date();
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      timeFormatted: timestamp.toLocaleTimeString(),
      dateFormatted: timestamp.toLocaleDateString(),
      userId: userEmailRef.current,
      type: 'firebase_read',
      operation: 'READ',
      collection,
      docId,
      queryParams,
      resultCount,
      description: docId 
        ? `Read document from ${collection}/${docId}` 
        : `Query ${collection} collection (${resultCount} results)`,
      impact: resultCount > 10 ? 'high' : resultCount > 3 ? 'medium' : 'low'
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 1000));
  }, []);

  const logFirebaseWrite = useCallback((collection, docId = null, operation = 'CREATE') => {
    const timestamp = new Date();
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      timeFormatted: timestamp.toLocaleTimeString(),
      dateFormatted: timestamp.toLocaleDateString(),
      userId: userEmailRef.current,
      type: 'firebase_write',
      operation,
      collection,
      docId,
      description: `${operation} in ${collection}${docId ? `/${docId}` : ''}`,
      impact: 'low'
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 1000));
  }, []);

  const logUserClick = useCallback((element, page, additionalData = {}) => {
    const timestamp = new Date();
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      timeFormatted: timestamp.toLocaleTimeString(),
      dateFormatted: timestamp.toLocaleDateString(),
      userId: userEmailRef.current,
      type: 'user_interaction',
      operation: 'CLICK',
      element,
      page,
      description: `Clicked "${element}" on ${page}`,
      impact: 'low',
      ...additionalData
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 1000));
  }, []);

  const logPageView = useCallback((page, route) => {
    const timestamp = new Date();
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      timeFormatted: timestamp.toLocaleTimeString(),
      dateFormatted: timestamp.toLocaleDateString(),
      userId: userEmailRef.current,
      type: 'navigation',
      operation: 'PAGE_VIEW',
      page,
      route,
      description: `Navigated to ${page}`,
      impact: 'low'
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 1000));
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const exportLogs = useCallback(() => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `firebase-logs-${new Date().toISOString().split('T')[0]}.txt`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [logs]);

  const getStats = useCallback(() => {
    const totalLogs = logs.length;
    const reads = logs.filter(log => log.type === 'firebase_read').length;
    const writes = logs.filter(log => log.type === 'firebase_write').length;
    const clicks = logs.filter(log => log.type === 'user_interaction').length;
    const pageViews = logs.filter(log => log.type === 'navigation').length;
    
    const now = new Date();
    const readsInLastHour = logs.filter(log => 
      log.type === 'firebase_read' && 
      (now - new Date(log.timestamp)) < 3600000
    ).length;

    const readsInLastMinute = logs.filter(log => 
      log.type === 'firebase_read' && 
      (now - new Date(log.timestamp)) < 60000
    ).length;

    const topCollections = logs
      .filter(log => log.type === 'firebase_read' && log.collection)
      .reduce((acc, log) => {
        acc[log.collection] = (acc[log.collection] || 0) + 1;
        return acc;
      }, {});

    return {
      totalLogs,
      reads,
      writes,
      clicks,
      pageViews,
      readsInLastHour,
      readsInLastMinute,
      topCollections
    };
  }, [logs]);

  // Create stable context value
  const contextValue = useMemo(() => ({
    logs,
    isAdmin,
    logFirebaseRead,
    logFirebaseWrite,
    logUserClick,
    logPageView,
    clearLogs,
    exportLogs,
    getStats
  }), [logs, isAdmin, logFirebaseRead, logFirebaseWrite, logUserClick, logPageView, clearLogs, exportLogs, getStats]);

  return (
    <FirebaseLoggerContext.Provider value={contextValue}>
      {children}
    </FirebaseLoggerContext.Provider>
  );
}; 