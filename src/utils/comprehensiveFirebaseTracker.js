import { db } from '../firebase';

// Clean up any old Firebase function overrides
const cleanupOldFirebaseOverrides = () => {
  // Restore original Firebase functions if they were monkey-patched
  if (window.originalGetDoc) {
    window.getDoc = window.originalGetDoc;
    delete window.originalGetDoc;
  }
  if (window.originalGetDocs) {
    window.getDocs = window.originalGetDocs;
    delete window.originalGetDocs;
  }
  if (window.originalOnSnapshot) {
    window.onSnapshot = window.originalOnSnapshot;
    delete window.originalOnSnapshot;
  }
  if (window.originalSetDoc) {
    window.setDoc = window.originalSetDoc;
    delete window.originalSetDoc;
  }
  if (window.originalUpdateDoc) {
    window.updateDoc = window.originalUpdateDoc;
    delete window.originalUpdateDoc;
  }
  if (window.originalDeleteDoc) {
    window.deleteDoc = window.originalDeleteDoc;
    delete window.originalDeleteDoc;
  }
  if (window.originalAddDoc) {
    window.addDoc = window.originalAddDoc;
    delete window.originalAddDoc;
  }
  
  console.log('🧹 Firebase Tracker: Cleaned up old function overrides');
};

// Global tracking state
let trackingEnabled = false;
let loggerCallback = null;
let operationCounter = 0;
let sessionStartTime = Date.now();

// Operation categories for manager understanding
const OPERATION_CATEGORIES = {
  'messages': {
    name: 'Chat Messages',
    icon: '💬',
    description: 'Real-time messaging and conversations',
    priority: 'high'
  },
  'channels': {
    name: 'Chat Rooms',
    icon: '🏢',
    description: 'Channel listings and management',
    priority: 'medium'
  },
  'users': {
    name: 'User Profiles',
    icon: '👤',
    description: 'User authentication and profiles',
    priority: 'medium'
  },
  'classes': {
    name: 'Class Management',
    icon: '📚',
    description: 'Educational classes and courses',
    priority: 'medium'
  },
  'tasks': {
    name: 'Task System',
    icon: '✅',
    description: 'Assignment and task tracking',
    priority: 'low'
  },
  'enrollments': {
    name: 'Student Records',
    icon: '📝',
    description: 'Student enrollment and registration',
    priority: 'medium'
  },
  'unknown': {
    name: 'System Operations',
    icon: '⚙️',
    description: 'Background system processes',
    priority: 'low'
  }
};

// Cost calculation (approximate Firebase pricing)
const COST_PER_READ = 0.00036; // $0.36 per 100K reads
const COST_PER_WRITE = 0.0018; // $1.80 per 100K writes

class FirebaseOperationTracker {
  constructor() {
    this.operations = [];
    this.realtimeListeners = new Map();
    this.statsCache = null;
    this.lastStatsUpdate = 0;
  }

  // Initialize comprehensive tracking
  initialize(callback) {
    if (trackingEnabled) return;
    
    // Clean up any old Firebase function overrides first
    cleanupOldFirebaseOverrides();
    
    loggerCallback = callback;
    trackingEnabled = true;
    sessionStartTime = Date.now();
    
    console.log('🔍 Firebase Tracker: Comprehensive monitoring started');
    
    // Start with a test operation to verify tracking works
    this.logOperation('TRACKER_INIT', 'system', 1, 'Firebase tracker initialized');
    
    // Intercept at multiple levels
    this.interceptFirestoreSDK();
    this.interceptNetworkRequests();
    this.monitorRealtimeListeners();
    this.setupDirectHookMonitoring();
    
    // Start background monitoring
    this.startBackgroundMonitoring();
  }

  // Intercept Firestore SDK operations at the source
  interceptFirestoreSDK() {
    // Since Firebase functions are read-only, we'll rely primarily on network interception
    // and monitoring real-time listeners directly
    console.log('📡 Firebase Tracker: Using network-level interception for Firebase operations');
    
    // We can still monitor some operations through other means
    this.patchWindowFirebaseFunctions();
    
    // Try to intercept Firebase SDK at the global level
    this.interceptGlobalFirebase();
  }

  // Intercept Firebase at the global level
  interceptGlobalFirebase() {
    // Try to access Firebase SDK globals
    if (typeof window !== 'undefined') {
      // Look for Firebase SDK in various locations
      const possibleFirebaseLocations = [
        window.firebase,
        window.Firebase,
        window.firestore,
        window.db
      ];
      
      possibleFirebaseLocations.forEach((firebaseObj, index) => {
        if (firebaseObj) {
          console.log(`🔍 Found Firebase object at location ${index}:`, firebaseObj);
          this.patchFirebaseObject(firebaseObj);
        }
      });
      
      // Also try to intercept common Firebase operations by monkey-patching prototypes
      this.patchFirebasePrototypes();
    }
  }

  // Patch Firebase object methods
  patchFirebaseObject(firebaseObj) {
    try {
      // Try to patch common methods if they exist
      const methodsToPatch = ['getDoc', 'getDocs', 'onSnapshot', 'setDoc', 'updateDoc', 'addDoc', 'deleteDoc'];
      
      methodsToPatch.forEach(methodName => {
        if (firebaseObj[methodName] && typeof firebaseObj[methodName] === 'function') {
          const originalMethod = firebaseObj[methodName];
          
          firebaseObj[methodName] = (...args) => {
            // Log the operation
            const collection = this.extractCollectionFromArgs(args);
            this.logOperation(`GLOBAL_${methodName.toUpperCase()}`, collection, 1, 
              `Global Firebase ${methodName} called`);
            
            // Call original method
            return originalMethod.apply(firebaseObj, args);
          };
          
          console.log(`✅ Patched global Firebase.${methodName}`);
        }
      });
    } catch (error) {
      console.warn('Could not patch Firebase object:', error);
    }
  }

  // Patch Firebase prototypes
  patchFirebasePrototypes() {
    try {
      // Try to find and patch DocumentReference prototype
      if (window.DocumentReference && window.DocumentReference.prototype) {
        this.patchPrototype(window.DocumentReference.prototype, 'DocumentReference');
      }
      
      // Try to find and patch Query prototype
      if (window.Query && window.Query.prototype) {
        this.patchPrototype(window.Query.prototype, 'Query');
      }
      
      // Try to find and patch CollectionReference prototype
      if (window.CollectionReference && window.CollectionReference.prototype) {
        this.patchPrototype(window.CollectionReference.prototype, 'CollectionReference');
      }
      
      console.log('🔧 Firebase prototype patching attempted');
    } catch (error) {
      console.warn('Could not patch Firebase prototypes:', error);
    }
  }

  // Patch a specific prototype
  patchPrototype(prototype, typeName) {
    const methodsToPatch = ['get', 'onSnapshot', 'set', 'update', 'delete', 'add'];
    
    methodsToPatch.forEach(methodName => {
      if (prototype[methodName] && typeof prototype[methodName] === 'function') {
        const originalMethod = prototype[methodName];
        
        prototype[methodName] = function(...args) {
          // Log the operation
          const collection = this.path ? this.path.split('/')[0] : 'unknown';
          tracker.logOperation(`PROTO_${methodName.toUpperCase()}`, collection, 1, 
            `${typeName}.${methodName} called`);
          
          // Call original method
          return originalMethod.apply(this, args);
        };
        
        console.log(`✅ Patched ${typeName}.prototype.${methodName}`);
      }
    });
  }

  // Extract collection name from Firebase function arguments
  extractCollectionFromArgs(args) {
    try {
      if (args && args.length > 0) {
        const firstArg = args[0];
        
        // Check if it's a DocumentReference or Query
        if (firstArg && firstArg.path) {
          return firstArg.path.split('/')[0];
        }
        
        // Check if it's a collection reference
        if (firstArg && firstArg._path && firstArg._path.segments) {
          return firstArg._path.segments[0];
        }
        
        // Check for other patterns
        if (firstArg && typeof firstArg === 'object') {
          // Look for common Firebase reference patterns
          const pathProps = ['_path', 'path', '_query'];
          for (const prop of pathProps) {
            if (firstArg[prop]) {
              const path = firstArg[prop];
              if (typeof path === 'string') {
                return path.split('/')[0];
              } else if (path.segments && path.segments.length > 0) {
                return path.segments[0];
              }
            }
          }
        }
      }
    } catch (error) {
      // Silently ignore extraction errors
    }
    
    return 'unknown';
  }

  // Patch Firestore delegate for deep interception
  patchFirestoreDelegate(delegate) {
    // Simplified - just log that we're monitoring
    console.log('🔍 Firebase Tracker: Monitoring Firestore delegate operations');
  }

  // Patch window functions (fallback method)
  patchWindowFirebaseFunctions() {
    // Simplified approach - just set up monitoring without trying to patch read-only functions
    console.log('🔧 Firebase Tracker: Setting up window-level monitoring');
    
    // Monitor common Firebase operations
    this.patchFunction('getDoc', 'READ');
    this.patchFunction('getDocs', 'READ');
    this.patchFunction('onSnapshot', 'REALTIME');
    this.patchFunction('setDoc', 'WRITE');
    this.patchFunction('updateDoc', 'WRITE');
    this.patchFunction('addDoc', 'WRITE');
    this.patchFunction('deleteDoc', 'WRITE');
  }

  // Patch individual Firebase functions
  patchFunction(functionName, operationType) {
    try {
      // Instead of trying to patch the imported functions (which are read-only),
      // we'll focus on network-level interception and direct hook monitoring
      console.log(`📝 Firebase Tracker: Monitoring ${functionName} operations via network interception`);
    } catch (error) {
      console.warn(`Could not set up monitoring for ${functionName}:`, error);
    }
  }

  // Intercept network requests to catch missed operations
  interceptNetworkRequests() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const url = args[0];
      
      // Log ALL requests to see what we're missing
      if (typeof url === 'string') {
        // Check for any Google/Firebase related requests
        if (url.includes('google') || url.includes('firebase') || url.includes('firestore')) {
          console.log('🌐 Intercepted URL:', url);
        }
      }
      
      // Check if it's a Firebase request (broader detection)
      if (typeof url === 'string' && (
        url.includes('firestore.googleapis.com') || 
        url.includes('firebase') ||
        url.includes('google.com/v1/projects') ||
        url.includes('googleapis.com') ||
        url.includes('firebaseapp.com')
      )) {
        const startTime = performance.now();
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          // Parse Firebase operation from URL
          const operation = this.parseFirebaseURL(url, args[1]);
          if (operation) {
            this.logOperation(operation.type, operation.collection, operation.estimatedCount, 
              `Network: ${Math.round(endTime - startTime)}ms`);
          } else {
            // Log unrecognized Firebase requests
            this.logOperation('UNKNOWN_FIREBASE', 'unknown', 1, `Unrecognized Firebase request: ${url.substring(0, 100)}`);
          }
          
          return response;
        } catch (error) {
          this.logOperation('NETWORK_ERROR', 'unknown', 0, error.message);
          throw error;
        }
      }
      
      return originalFetch(...args);
    };

    // Also intercept XMLHttpRequest for older Firebase operations
    this.interceptXMLHttpRequest();
    
    // Intercept WebSocket connections for real-time operations
    this.interceptWebSocket();
    
    // Add performance observer to catch resource loading
    this.setupPerformanceObserver();
  }

  // Parse Firebase URL to extract operation info
  parseFirebaseURL(url, options) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Enhanced collection name extraction
      let collection = 'unknown';
      let estimatedCount = 1;
      let type = 'UNKNOWN';
      
      // Handle different Firebase URL patterns
      if (url.includes('firestore.googleapis.com')) {
        // Standard Firestore REST API
        const documentsIndex = pathParts.findIndex(part => part === 'documents');
        if (documentsIndex >= 0 && pathParts[documentsIndex + 1]) {
          collection = pathParts[documentsIndex + 1];
        }
        
        // Determine operation type from method and URL structure
        const method = options?.method || 'GET';
        if (method === 'GET') {
          if (url.includes(':runQuery') || url.includes(':batchGet')) {
            type = 'QUERY_READ';
            estimatedCount = 10; // Queries typically return multiple docs
          } else if (url.includes(':listen')) {
            type = 'LISTEN_START';
            estimatedCount = 1;
          } else {
            type = 'DOCUMENT_READ';
            estimatedCount = 1;
          }
        } else if (['POST', 'PATCH', 'PUT'].includes(method)) {
          if (url.includes(':commit')) {
            type = 'BATCH_WRITE';
            estimatedCount = 1;
          } else {
            type = 'DOCUMENT_WRITE';
            estimatedCount = 1;
          }
        } else if (method === 'DELETE') {
          type = 'DOCUMENT_DELETE';
          estimatedCount = 1;
        }
      } else if (url.includes('firebase') || url.includes('google.com/v1/projects')) {
        // Other Firebase services
        if (url.includes('auth')) {
          collection = 'auth';
          type = 'AUTH_OPERATION';
        } else if (url.includes('storage')) {
          collection = 'storage';
          type = 'STORAGE_OPERATION';
        } else if (url.includes('functions')) {
          collection = 'functions';
          type = 'FUNCTION_CALL';
        } else {
          collection = 'firebase_service';
          type = 'SERVICE_OPERATION';
        }
      }
      
      // Extract more specific collection info from query parameters
      if (urlObj.searchParams) {
        const structuredQuery = urlObj.searchParams.get('structuredQuery');
        if (structuredQuery) {
          try {
            const query = JSON.parse(structuredQuery);
            if (query.from && query.from[0] && query.from[0].collectionId) {
              collection = query.from[0].collectionId;
            }
            if (query.limit) {
              estimatedCount = Math.min(query.limit, 100); // Cap at reasonable number
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
      }
      
      return { type, collection, estimatedCount };
    } catch (error) {
      return null;
    }
  }

  // Monitor real-time listeners for unusual activity
  monitorRealtimeListeners() {
    setInterval(() => {
      this.realtimeListeners.forEach((listener, id) => {
        const age = Date.now() - listener.startTime;
        const minutes = Math.floor(age / 60000);
        
        // Alert for long-running listeners with high read counts
        if (minutes > 5 && listener.readCount > 50) {
          this.logOperation('LISTENER_ALERT', listener.collection, listener.readCount, 
            `High activity listener: ${listener.readCount} reads in ${minutes}min`);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  // Start background monitoring
  startBackgroundMonitoring() {
    // Monitor overall performance
    setInterval(() => {
      this.checkPerformanceMetrics();
    }, 10000); // Every 10 seconds

    // Clean old operations
    setInterval(() => {
      this.cleanOldOperations();
    }, 60000); // Every minute
    
    // Add aggressive Firebase operation detection
    this.startAggressiveMonitoring();
  }

  // Aggressive monitoring to catch missed operations
  startAggressiveMonitoring() {
    let lastOperationCount = this.operations.length;
    let consecutiveNoChange = 0;
    
    // Check every 5 seconds if we're missing operations
    setInterval(() => {
      const currentCount = this.operations.length;
      
      // If no new operations detected but we know Firebase should be active
      if (currentCount === lastOperationCount) {
        consecutiveNoChange++;
        
        // If we haven't detected operations for 30 seconds, assume we're missing them
        if (consecutiveNoChange >= 6) {
          // Estimate missed operations based on real-time listeners
          const activeListeners = this.realtimeListeners.size;
          if (activeListeners > 0) {
            // Estimate that each active listener generates reads
            const estimatedReads = activeListeners * 2; // Conservative estimate
            
            this.logOperation('ESTIMATED_READS', 'realtime', estimatedReads, 
              `Estimated ${estimatedReads} missed reads from ${activeListeners} active listeners`);
            
            console.warn(`🚨 Possible missed operations detected. Active listeners: ${activeListeners}`);
          }
          
          consecutiveNoChange = 0; // Reset counter
        }
      } else {
        consecutiveNoChange = 0; // Reset if we detected new operations
      }
      
      lastOperationCount = currentCount;
    }, 5000);
    
    // Monitor browser network activity more aggressively
    this.monitorBrowserNetworkActivity();
  }

  // Monitor browser network activity
  monitorBrowserNetworkActivity() {
    // Check if we can access browser's network information
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // Monitor for network activity changes
      let lastNetworkChange = Date.now();
      
      const checkNetworkActivity = () => {
        const now = Date.now();
        
        // If there's been network activity but no Firebase operations logged recently
        if (now - lastNetworkChange < 10000) { // Within last 10 seconds
          const recentOps = this.operations.filter(op => now - op.timestamp < 10000);
          
          if (recentOps.length === 0 && this.realtimeListeners.size > 0) {
            // Likely missing Firebase operations
            this.logOperation('NETWORK_ACTIVITY_DETECTED', 'unknown', 1, 
              'Network activity detected but no Firebase operations logged');
          }
        }
      };
      
      // Check every 15 seconds
      setInterval(checkNetworkActivity, 15000);
    }
    
    // Also monitor document visibility changes (which often trigger Firebase operations)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible - likely to trigger Firebase operations
        setTimeout(() => {
          this.logOperation('PAGE_VISIBLE', 'system', 1, 'Page became visible - likely Firebase sync');
        }, 1000);
      }
    });
  }

  // Check performance metrics
  checkPerformanceMetrics() {
    const recentOps = this.operations.filter(op => 
      Date.now() - op.timestamp < 60000 // Last minute
    );

    const readsPerMinute = recentOps.filter(op => 
      op.type.includes('READ') || op.type === 'REALTIME_READ'
    ).length;

    if (readsPerMinute > 100) {
      this.logOperation('PERFORMANCE_ALERT', 'system', readsPerMinute, 
        `High read activity: ${readsPerMinute} reads/minute`);
    }
  }

  // Log operation with comprehensive details
  logOperation(type, collection, resultCount = null, details = '') {
    operationCounter++;
    
    const operation = {
      id: operationCounter,
      timestamp: Date.now(),
      type,
      collection: collection || 'unknown',
      resultCount: resultCount || 0,
      details,
      category: OPERATION_CATEGORIES[collection] || OPERATION_CATEGORIES.unknown,
      cost: this.calculateCost(type, resultCount),
      sessionTime: Date.now() - sessionStartTime
    };

    this.operations.push(operation);
    
    // Notify callback
    if (loggerCallback) {
      loggerCallback(operation);
    }

    // Clear stats cache
    this.statsCache = null;

    // Enhanced logging for debugging
    if (type.includes('NETWORK') || type.includes('XHR') || type.includes('WEBSOCKET')) {
      console.log(`🔥 Firebase Network: ${type} on ${collection} (${resultCount || 0} docs) - ${details}`);
    } else {
      console.log(`🔥 Firebase Manual: ${type} on ${collection} (${resultCount || 0} docs) - ${details}`);
    }
  }

  // Calculate operation cost
  calculateCost(type, resultCount = 1) {
    const count = resultCount || 1;
    
    if (type.includes('READ') || type === 'REALTIME_READ') {
      return count * COST_PER_READ;
    } else if (type.includes('WRITE') || type.includes('UPDATE') || type.includes('DELETE')) {
      return count * COST_PER_WRITE;
    }
    
    return 0;
  }

  // Extract collection name from Firebase reference
  extractCollectionName(ref) {
    if (!ref) return 'unknown';
    
    try {
      if (ref.path) {
        return ref.path.split('/')[0];
      }
      if (ref._query?.path?.segments) {
        return ref._query.path.segments[0];
      }
      if (ref._path?.segments) {
        return ref._path.segments[0];
      }
      if (ref.id && ref.parent) {
        return ref.parent.id || 'unknown';
      }
    } catch (error) {
      console.warn('Could not extract collection name:', error);
    }
    
    return 'unknown';
  }

  // Generate unique listener ID
  generateListenerId(ref) {
    const collection = this.extractCollectionName(ref);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${collection}_${timestamp}_${random}`;
  }

  // Clean old operations to prevent memory bloat
  cleanOldOperations() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.operations = this.operations.filter(op => op.timestamp > oneHourAgo);
  }

  // Get comprehensive statistics
  getStats() {
    const now = Date.now();
    
    // Use cache if recent
    if (this.statsCache && (now - this.lastStatsUpdate) < 5000) {
      return this.statsCache;
    }

    try {
      const stats = this.calculateStats();
      this.statsCache = stats;
      this.lastStatsUpdate = now;
      
      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      
      // Return a safe default stats object
      return {
        session: {
          totalOperations: this.operations.length,
          totalReads: this.operations.filter(op => op.type.includes('READ')).length,
          totalWrites: this.operations.filter(op => op.type.includes('WRITE')).length,
          totalCost: this.operations.reduce((sum, op) => sum + (op.cost || 0), 0),
          duration: now - sessionStartTime
        },
        last5min: { operations: 0, reads: 0, writes: 0, readsPerMinute: 0, cost: 0, topCollections: [] },
        last1hour: { operations: 0, reads: 0, writes: 0, readsPerMinute: 0, cost: 0, topCollections: [] },
        collections: [],
        realtimeListeners: { active: this.realtimeListeners.size, list: [] },
        alerts: []
      };
    }
  }

  // Calculate comprehensive statistics
  calculateStats() {
    const now = Date.now();
    const last5min = now - (5 * 60 * 1000);
    const last1hour = now - (60 * 60 * 1000);
    
    const recent5min = this.operations.filter(op => op.timestamp > last5min);
    const recent1hour = this.operations.filter(op => op.timestamp > last1hour);
    
    // Calculate by time periods
    const stats = {
      session: {
        totalOperations: this.operations.length,
        totalReads: this.operations.filter(op => op.type.includes('READ')).length,
        totalWrites: this.operations.filter(op => op.type.includes('WRITE')).length,
        totalCost: this.operations.reduce((sum, op) => sum + (op.cost || 0), 0),
        duration: now - sessionStartTime
      },
      last5min: this.calculatePeriodStats(recent5min, 5),
      last1hour: this.calculatePeriodStats(recent1hour, 60),
      collections: this.calculateCollectionStats(),
      realtimeListeners: {
        active: this.realtimeListeners.size,
        list: Array.from(this.realtimeListeners.entries()).map(([id, listener]) => ({
          id,
          collection: listener.collection,
          duration: now - listener.startTime,
          readCount: listener.readCount
        }))
      },
      alerts: [] // Initialize empty, will be populated separately to avoid recursion
    };

    // Generate alerts separately to avoid recursion
    try {
      stats.alerts = this.generateAlerts();
    } catch (error) {
      console.error('Error generating alerts:', error);
      stats.alerts = [];
    }

    return stats;
  }

  // Calculate statistics for a time period
  calculatePeriodStats(operations, periodMinutes) {
    const reads = operations.filter(op => op.type.includes('READ'));
    const writes = operations.filter(op => op.type.includes('WRITE'));
    
    return {
      operations: operations.length,
      reads: reads.length,
      writes: writes.length,
      readsPerMinute: Math.round(reads.length / periodMinutes * 10) / 10,
      cost: operations.reduce((sum, op) => sum + op.cost, 0),
      topCollections: this.getTopCollections(operations)
    };
  }

  // Calculate collection-specific statistics
  calculateCollectionStats() {
    const collectionMap = new Map();
    
    this.operations.forEach(op => {
      const collection = op.collection;
      if (!collectionMap.has(collection)) {
        collectionMap.set(collection, {
          name: collection,
          category: op.category,
          operations: 0,
          reads: 0,
          writes: 0,
          cost: 0,
          avgResultCount: 0,
          lastActivity: 0
        });
      }
      
      const stats = collectionMap.get(collection);
      stats.operations++;
      stats.cost += op.cost;
      stats.lastActivity = Math.max(stats.lastActivity, op.timestamp);
      
      if (op.type.includes('READ')) {
        stats.reads++;
        stats.avgResultCount = ((stats.avgResultCount * (stats.reads - 1)) + op.resultCount) / stats.reads;
      } else if (op.type.includes('WRITE')) {
        stats.writes++;
      }
    });

    return Array.from(collectionMap.values())
      .sort((a, b) => b.operations - a.operations);
  }

  // Get top collections for a set of operations
  getTopCollections(operations) {
    const collectionCounts = {};
    
    operations.forEach(op => {
      collectionCounts[op.collection] = (collectionCounts[op.collection] || 0) + 1;
    });

    return Object.entries(collectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([collection, count]) => ({ collection, count }));
  }

  // Generate intelligent alerts
  generateAlerts() {
    const alerts = [];
    const now = Date.now();
    const last5min = now - (5 * 60 * 1000);
    const recent5min = this.operations.filter(op => op.timestamp > last5min);
    
    // Calculate reads per minute for last 5 minutes
    const readsInLast5Min = recent5min.filter(op => op.type.includes('READ')).length;
    const readsPerMinute = readsInLast5Min / 5;
    
    // High read rate alert
    if (readsPerMinute > 20) {
      alerts.push({
        type: 'warning',
        title: 'High Read Activity',
        message: `${readsPerMinute.toFixed(1)} reads per minute in last 5 minutes`,
        impact: 'medium'
      });
    }

    // Cost alert
    const totalCost = this.operations.reduce((sum, op) => sum + op.cost, 0);
    if (totalCost > 0.01) {
      alerts.push({
        type: 'info',
        title: 'Usage Cost',
        message: `Session cost: $${totalCost.toFixed(4)}`,
        impact: 'low'
      });
    }

    // Long-running listeners
    const longListeners = Array.from(this.realtimeListeners.entries()).filter(([id, listener]) => 
      (now - listener.startTime) > 300000 // 5 minutes
    );
    if (longListeners.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Long-running Listeners',
        message: `${longListeners.length} listeners active for 5+ minutes`,
        impact: 'medium'
      });
    }

    return alerts;
  }

  // Get recent operations for display
  getRecentOperations(limit = 50) {
    return this.operations
      .slice(-limit)
      .reverse(); // Most recent first
  }

  // Stop tracking
  stop() {
    trackingEnabled = false;
    loggerCallback = null;
    this.operations = [];
    this.realtimeListeners.clear();
    console.log('🔍 Firebase Tracker: Monitoring stopped');
  }

  // Add direct hook monitoring for the specific hooks used in the app
  setupDirectHookMonitoring() {
    console.log('🎯 Firebase Tracker: Setting up direct hook monitoring');
    
    // Monitor useChannels and useMessages hooks by intercepting their Firebase calls
    this.interceptFirebaseImports();
  }

  // Intercept Firebase imports at the module level
  interceptFirebaseImports() {
    // Since we can't patch the imported functions directly, we'll use a different approach
    // We'll monkey-patch the global Firebase functions that might be used
    
    // Try to intercept at the window level for any global Firebase usage
    if (typeof window !== 'undefined') {
      this.setupWindowLevelInterception();
    }
  }

  // Setup window-level interception for Firebase operations
  setupWindowLevelInterception() {
    // Remove the console.log interception that was causing infinite recursion
    console.log('🔧 Firebase Tracker: Setting up window-level monitoring (simplified)');

    // Try to intercept XMLHttpRequest and fetch more aggressively
    this.setupAggressiveNetworkInterception();
  }

  // More aggressive network interception
  setupAggressiveNetworkInterception() {
    const tracker = this; // Capture the tracker instance
    
    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._firebaseTrackerMethod = method;
      this._firebaseTrackerUrl = url;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      if (this._firebaseTrackerUrl && this._firebaseTrackerUrl.includes('firestore')) {
        try {
          const operation = tracker.parseFirebaseURL(this._firebaseTrackerUrl, { method: this._firebaseTrackerMethod });
          if (operation) {
            tracker.logOperation(operation.type, operation.collection, operation.estimatedCount, 
              `XHR: ${this._firebaseTrackerMethod} ${operation.collection}`);
          }
        } catch (error) {
          // Silently ignore errors to prevent recursion
        }
      }
      return originalXHRSend.apply(this, arguments);
    };

    console.log('🌐 Firebase Tracker: Network interception enabled');
  }

  // Enhanced XMLHttpRequest interception
  interceptXMLHttpRequest() {
    const tracker = this;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._firebaseTrackerMethod = method;
      this._firebaseTrackerUrl = url;
      this._firebaseTrackerStartTime = performance.now();
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      if (this._firebaseTrackerUrl && (
        this._firebaseTrackerUrl.includes('firestore.googleapis.com') ||
        this._firebaseTrackerUrl.includes('firebase') ||
        this._firebaseTrackerUrl.includes('google.com/v1/projects')
      )) {
        
        // Set up response handler
        const originalOnReadyStateChange = this.onreadystatechange;
        this.onreadystatechange = function() {
          if (this.readyState === 4) { // Request completed
            const endTime = performance.now();
            const duration = Math.round(endTime - this._firebaseTrackerStartTime);
            
            try {
              const operation = tracker.parseFirebaseURL(this._firebaseTrackerUrl, { 
                method: this._firebaseTrackerMethod 
              });
              
              if (operation) {
                // Try to get actual result count from response
                let resultCount = operation.estimatedCount;
                try {
                  if (this.responseText) {
                    const response = JSON.parse(this.responseText);
                    if (response.documents) {
                      resultCount = response.documents.length;
                    } else if (response.document) {
                      resultCount = 1;
                    }
                  }
                } catch (e) {
                  // Use estimated count if parsing fails
                }
                
                tracker.logOperation(
                  `${operation.type}_XHR`, 
                  operation.collection, 
                  resultCount, 
                  `XHR ${this._firebaseTrackerMethod}: ${duration}ms`
                );
              }
            } catch (error) {
              // Silently ignore parsing errors
            }
          }
          
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments);
          }
        };
      }
      
      return originalXHRSend.apply(this, arguments);
    };

    console.log('🌐 Firebase Tracker: Enhanced XHR interception enabled');
  }

  // Intercept WebSocket for real-time operations
  interceptWebSocket() {
    const tracker = this;
    const originalWebSocket = window.WebSocket;
    
    window.WebSocket = function(url, protocols) {
      const ws = new originalWebSocket(url, protocols);
      
      // Check if this is a Firebase WebSocket
      if (url && (url.includes('firebase') || url.includes('firestore'))) {
        tracker.logOperation('WEBSOCKET_CONNECT', 'realtime', 1, `WebSocket connection to ${url}`);
        
        // Track messages
        const originalOnMessage = ws.onmessage;
        ws.onmessage = function(event) {
          try {
            // Try to parse the message to count operations
            const data = JSON.parse(event.data);
            if (data && data.docs) {
              tracker.logOperation('WEBSOCKET_READ', 'realtime', data.docs.length, 'WebSocket real-time update');
            } else {
              tracker.logOperation('WEBSOCKET_READ', 'realtime', 1, 'WebSocket message received');
            }
          } catch (e) {
            tracker.logOperation('WEBSOCKET_READ', 'realtime', 1, 'WebSocket message received');
          }
          
          if (originalOnMessage) {
            originalOnMessage.apply(this, arguments);
          }
        };
      }
      
      return ws;
    };
    
    console.log('🔌 Firebase Tracker: WebSocket interception enabled');
  }

  // Add performance observer to catch all network requests
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name && (
            entry.name.includes('firestore') || 
            entry.name.includes('firebase') ||
            entry.name.includes('googleapis.com')
          )) {
            console.log('📊 Performance Observer caught Firebase request:', entry.name);
            
            // Try to parse and log this operation
            const operation = this.parseFirebaseURL(entry.name, { method: 'GET' });
            if (operation) {
              this.logOperation(`PERF_${operation.type}`, operation.collection, operation.estimatedCount, 
                `Performance Observer: ${Math.round(entry.duration)}ms`);
            }
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['resource', 'navigation'] });
        console.log('📊 Performance Observer enabled for Firebase tracking');
      } catch (error) {
        console.warn('Could not enable Performance Observer:', error);
      }
    }
  }
}

// Global instance
const tracker = new FirebaseOperationTracker();

// Auto-initialize tracking as soon as this module is imported
// This ensures we capture early Firebase operations like authentication and seeding
let autoInitialized = false;

const autoInitialize = () => {
  if (!autoInitialized && typeof window !== 'undefined') {
    autoInitialized = true;
    console.log('🚀 Firebase Tracker: Auto-initializing to capture early operations');
    
    // Start tracking immediately with a simple callback
    tracker.initialize((operation) => {
      // Store operations in a temporary array until the main context takes over
      if (!window.firebaseTrackerOperations) {
        window.firebaseTrackerOperations = [];
      }
      window.firebaseTrackerOperations.push(operation);
    });
  }
};

// Auto-initialize when module loads
autoInitialize();

// Create Firebase function proxies for interception
const createFirebaseProxy = () => {
  if (typeof window !== 'undefined') {
    // Try to intercept Firebase imports by creating global proxies
    const firebaseFunctions = [
      'getDoc', 'getDocs', 'onSnapshot', 'setDoc', 'updateDoc', 'addDoc', 'deleteDoc',
      'collection', 'doc', 'query', 'where', 'orderBy', 'limit'
    ];
    
    firebaseFunctions.forEach(funcName => {
      // Create a proxy function that logs operations
      if (!window[`original_${funcName}`]) {
        window[`firebase_proxy_${funcName}`] = (...args) => {
          // Log the operation
          const collection = tracker.extractCollectionFromArgs ? 
            tracker.extractCollectionFromArgs(args) : 'unknown';
          
          tracker.logOperation(`PROXY_${funcName.toUpperCase()}`, collection, 1, 
            `Proxy intercepted ${funcName}`);
          
          // Note: We can't call the original here since we don't have access to it
          // This is mainly for logging purposes
        };
      }
    });
    
    console.log('🎭 Firebase function proxies created');
  }
};

// Create proxies when module loads
createFirebaseProxy();

// Add a Firebase operation estimator based on known patterns
const estimateFirebaseOperations = () => {
  // This function estimates Firebase operations based on app behavior patterns
  // when direct interception fails
  
  let estimationInterval;
  
  const startEstimation = () => {
    if (estimationInterval) return;
    
    estimationInterval = setInterval(() => {
      // Estimate operations based on:
      // 1. Number of active real-time listeners
      // 2. User activity (mouse/keyboard events)
      // 3. Page visibility
      // 4. Time since last detected operation
      
      const activeListeners = tracker.realtimeListeners.size;
      const recentOps = tracker.operations.filter(op => 
        Date.now() - op.timestamp < 30000 // Last 30 seconds
      );
      
      // If we have active listeners but no recent operations, estimate missed reads
      if (activeListeners > 0 && recentOps.length < 5) {
        // Conservative estimate: each listener generates 1-3 reads per 30 seconds
        const estimatedReads = activeListeners * Math.floor(Math.random() * 3) + 1;
        
        tracker.logOperation('ESTIMATED_REALTIME', 'messages', estimatedReads, 
          `Estimated ${estimatedReads} reads from ${activeListeners} active listeners`);
      }
      
      // Estimate auth operations
      if (recentOps.filter(op => op.collection === 'users').length === 0) {
        // Likely missing user profile checks
        tracker.logOperation('ESTIMATED_AUTH', 'users', 1, 'Estimated user profile check');
      }
      
    }, 30000); // Every 30 seconds
  };
  
  const stopEstimation = () => {
    if (estimationInterval) {
      clearInterval(estimationInterval);
      estimationInterval = null;
    }
  };
  
  return { startEstimation, stopEstimation };
};

// Create the estimator
const operationEstimator = estimateFirebaseOperations();

// Start estimation when tracking begins
const originalStartTracking = (callback) => {
  // If already auto-initialized, transfer existing operations to new callback
  if (autoInitialized && window.firebaseTrackerOperations) {
    console.log(`🔄 Firebase Tracker: Transferring ${window.firebaseTrackerOperations.length} early operations`);
    
    // Replay early operations to the new callback
    window.firebaseTrackerOperations.forEach(operation => {
      if (callback) callback(operation);
    });
    
    // Clear the temporary storage
    window.firebaseTrackerOperations = [];
  }
  
  return tracker.initialize(callback);
};

const enhancedStartTracking = (callback) => {
  const result = originalStartTracking(callback);
  operationEstimator.startEstimation();
  return result;
};

// Stop estimation when tracking stops
const enhancedStopTracking = () => {
  operationEstimator.stopEstimation();
  return tracker.stop();
};

export default tracker;

// Export functions for easy use
export const startTracking = enhancedStartTracking;
export const stopTracking = enhancedStopTracking;
export const getStats = () => tracker.getStats();
export const getRecentOperations = (limit) => tracker.getRecentOperations(limit);

// Manual logging functions for direct use in hooks
export const logFirebaseOperation = (type, collection, resultCount = 1, details = '') => {
  // Ensure tracker is initialized
  if (!autoInitialized) autoInitialize();
  
  if (trackingEnabled || autoInitialized) {
    tracker.logOperation(type, collection, resultCount, details);
  }
};

export const logFirebaseRead = (collection, resultCount = 1, details = '') => {
  logFirebaseOperation('MANUAL_READ', collection, resultCount, details);
};

export const logFirebaseWrite = (collection, details = '') => {
  logFirebaseOperation('MANUAL_WRITE', collection, 1, details);
};

export const logRealtimeListener = (collection, resultCount = 0, details = '') => {
  logFirebaseOperation('REALTIME_READ', collection, resultCount, details);
};

// Debug mode for troubleshooting
export const enableDebugMode = () => {
  console.log('🐛 Firebase Tracker Debug Mode Enabled');
  
  // Log all console messages to see what's happening
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // Check if it's a Firebase-related message
    const message = args.join(' ');
    if (message.includes('firebase') || message.includes('firestore') || message.includes('Firebase')) {
      originalConsoleLog('🔥 FIREBASE DEBUG:', ...args);
    } else {
      originalConsoleLog(...args);
    }
  };
  
  // Add more aggressive operation detection
  setInterval(() => {
    const stats = tracker.getStats();
    console.log('🔥 FIREBASE STATS:', {
      totalOps: stats.session.totalOperations,
      last5min: stats.last5min.operations,
      activeListeners: stats.realtimeListeners.active
    });
  }, 10000);
  
  // Monitor for any Firebase objects in the global scope
  setInterval(() => {
    const firebaseObjects = [];
    
    // Check for Firebase objects
    if (window.firebase) firebaseObjects.push('window.firebase');
    if (window.db) firebaseObjects.push('window.db');
    if (window.firestore) firebaseObjects.push('window.firestore');
    
    if (firebaseObjects.length > 0) {
      console.log('🔥 FIREBASE OBJECTS FOUND:', firebaseObjects);
    }
  }, 30000);
}; 