import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, AlertTriangle, TrendingUp, TrendingDown, DollarSign, 
  Clock, Database, Users, MessageCircle, Eye, EyeOff, RefreshCw,
  CheckCircle, AlertCircle, Info, Download, BarChart3, Zap
} from 'lucide-react';
import { getRecentOperations, getStats } from '../../utils/comprehensiveFirebaseTracker';

const ManagerFirebaseDashboard = ({ stats, recentOperations, isVisible, onToggle }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Memoized calculations for performance
  const dashboardData = useMemo(() => {
    if (!stats) return null;

    const session = stats.session;
    const last5min = stats.last5min;
    const alerts = stats.alerts || [];

    // Calculate session duration in readable format
    const sessionDuration = formatDuration(session.duration);
    
    // Calculate efficiency metrics
    const readWriteRatio = session.totalWrites > 0 ? 
      Math.round(session.totalReads / session.totalWrites) : session.totalReads;
    
    // Cost per minute
    const costPerMinute = session.duration > 0 ? 
      (session.totalCost / (session.duration / 60000)).toFixed(6) : 0;

    // Performance status
    const performanceStatus = getPerformanceStatus(last5min.readsPerMinute, alerts);
    
    return {
      session,
      last5min,
      alerts,
      sessionDuration,
      readWriteRatio,
      costPerMinute,
      performanceStatus,
      collections: stats.collections || [],
      realtimeListeners: stats.realtimeListeners || { active: 0, list: [] }
    };
  }, [stats, lastUpdate]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50"
        title="Show Database Monitor"
      >
        <Activity size={24} />
      </button>
    );
  }

  if (!dashboardData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Starting Database Monitor...
            </h3>
            <p className="text-gray-600">
              Collecting database usage information for analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Database Performance Monitor</h1>
                <p className="text-indigo-100">
                  Real-time analysis of app database usage and costs
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  autoRefresh 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
                <span className="text-sm">
                  {autoRefresh ? 'Live' : 'Paused'}
                </span>
              </button>
              <button
                onClick={onToggle}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
              >
                <EyeOff size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'activity', name: 'Live Activity', icon: Zap },
              { id: 'costs', name: 'Costs & Usage', icon: DollarSign },
              { id: 'details', name: 'Technical Details', icon: Database }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab data={dashboardData} />
          )}
          {activeTab === 'activity' && (
            <ActivityTab data={dashboardData} recentOperations={recentOperations} />
          )}
          {activeTab === 'costs' && (
            <CostsTab data={dashboardData} />
          )}
          {activeTab === 'details' && (
            <DetailsTab data={dashboardData} />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data }) => {
  const alerts = data.alerts || [];
  const criticalAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-800">Attention Required</h3>
              <p className="text-orange-700">
                {criticalAlerts[0].message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard
          icon={Activity}
          title="System Status"
          value={data.performanceStatus.label}
          subtitle={`${data.last5min.readsPerMinute}/min database requests`}
          color={data.performanceStatus.color}
          trend={data.last5min.operations > data.session.totalOperations / 10 ? 'up' : 'down'}
        />
        
        <StatusCard
          icon={DollarSign}
          title="Session Cost"
          value={`$${data.session.totalCost.toFixed(4)}`}
          subtitle={`$${data.costPerMinute}/minute rate`}
          color="green"
          trend={parseFloat(data.costPerMinute) > 0.001 ? 'up' : 'neutral'}
        />
        
        <StatusCard
          icon={Clock}
          title="Session Time"
          value={data.sessionDuration}
          subtitle={`${data.session.totalOperations} total operations`}
          color="blue"
          trend="neutral"
        />
        
        <StatusCard
          icon={Database}
          title="Data Efficiency"
          value={`${data.readWriteRatio}:1`}
          subtitle="Read to write ratio"
          color={data.readWriteRatio > 100 ? 'orange' : 'green'}
          trend={data.readWriteRatio > 100 ? 'up' : 'neutral'}
        />
      </div>

      {/* App Feature Usage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-indigo-600" />
          App Feature Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.collections.slice(0, 6).map((collection) => (
            <FeatureCard
              key={collection.name}
              category={collection.category}
              operations={collection.operations}
              cost={collection.cost}
            />
          ))}
        </div>
      </div>

      {/* Real-time Connections */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-green-600" />
          Live Connections ({data.realtimeListeners.active})
        </h3>
        {data.realtimeListeners.active === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No active real-time connections
          </p>
        ) : (
          <div className="space-y-3">
            {data.realtimeListeners.list.slice(0, 5).map((listener, index) => (
              <div key={listener.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {getCollectionDisplayName(listener.collection)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Active for {formatDuration(listener.duration)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-indigo-600">{listener.readCount}</p>
                  <p className="text-xs text-gray-500">updates</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Activity Tab Component
const ActivityTab = ({ data, recentOperations }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredOperations = useMemo(() => {
    if (!recentOperations) return [];
    
    let filtered = recentOperations;
    if (filter !== 'all') {
      filtered = recentOperations.filter(op => op.type.toLowerCase().includes(filter));
    }
    
    return filtered.slice(0, 50);
  }, [recentOperations, filter]);

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Last 5 Minutes</h3>
              <p className="text-3xl font-bold text-blue-600">{data.last5min.operations}</p>
              <p className="text-blue-700">database operations</p>
            </div>
            <Activity className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Read Operations</h3>
              <p className="text-3xl font-bold text-green-600">{data.last5min.reads}</p>
              <p className="text-green-700">{data.last5min.readsPerMinute}/min average</p>
            </div>
            <Eye className="h-12 w-12 text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Write Operations</h3>
              <p className="text-3xl font-bold text-purple-600">{data.last5min.writes}</p>
              <p className="text-purple-700">data modifications</p>
            </div>
            <Database className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Activity Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Operations</option>
            <option value="read">Read Operations</option>
            <option value="write">Write Operations</option>
            <option value="realtime">Real-time Updates</option>
          </select>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredOperations.map((operation) => (
            <ActivityRow key={operation.id} operation={operation} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Activity Row Component
const ActivityRow = ({ operation }) => {
  const timeAgo = formatTimeAgo(operation.timestamp);
  const icon = getOperationIcon(operation.type);
  const color = getOperationColor(operation.type);
  
  return (
    <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-full ${color.bg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="font-medium text-gray-900">
            {operation.category.name}
          </p>
          <span className="text-xs text-gray-500">
            {operation.category.icon}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {operation.details || getOperationDescription(operation.type)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {operation.resultCount > 0 && `${operation.resultCount} docs`}
        </p>
        <p className="text-xs text-gray-500">{timeAgo}</p>
      </div>
    </div>
  );
};

// Costs Tab Component
const CostsTab = ({ data }) => {
  const projectedMonthlyCost = (data.costPerMinute * 60 * 24 * 30).toFixed(2);
  const projectedDailyCost = (data.costPerMinute * 60 * 24).toFixed(4);

  return (
    <div className="space-y-6">
      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Current Session</h3>
          <p className="text-3xl font-bold text-green-600">${data.session.totalCost.toFixed(4)}</p>
          <p className="text-green-700">actual cost so far</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Daily Projection</h3>
          <p className="text-3xl font-bold text-blue-600">${projectedDailyCost}</p>
          <p className="text-blue-700">at current usage rate</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Monthly Projection</h3>
          <p className="text-3xl font-bold text-purple-600">${projectedMonthlyCost}</p>
          <p className="text-purple-700">at current usage rate</p>
        </div>
      </div>

      {/* Cost Breakdown by Feature */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by App Feature</h3>
        <div className="space-y-4">
          {data.collections.map((collection) => (
            <div key={collection.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{collection.category.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{collection.category.name}</p>
                  <p className="text-sm text-gray-600">{collection.operations} operations</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-indigo-600">${collection.cost.toFixed(4)}</p>
                <p className="text-xs text-gray-500">
                  {((collection.cost / data.session.totalCost) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Insights */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">💡 Cost Insights</h3>
        <div className="space-y-2 text-yellow-800">
          <p>• Firebase charges per database operation (read/write)</p>
          <p>• Real-time features generate more reads but provide better user experience</p>
          <p>• Current usage is {data.readWriteRatio > 50 ? 'read-heavy' : 'balanced'} 
             ({data.readWriteRatio}:1 read-to-write ratio)</p>
          <p>• {data.realtimeListeners.active} active real-time connections are generating live updates</p>
        </div>
      </div>
    </div>
  );
};

// Details Tab Component
const DetailsTab = ({ data }) => {
  // Export session data as JSON
  const exportSessionData = () => {
    try {
      // Get all operations from the tracker
      const allOperations = getRecentOperations(1000); // Get up to 1000 recent operations
      const fullStats = getStats();
      
      // Create comprehensive export data
      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          sessionDuration: data.sessionDuration,
          totalOperations: data.session.totalOperations,
          exportedOperations: allOperations.length
        },
        summary: {
          session: data.session,
          last5min: data.last5min,
          collections: data.collections,
          realtimeListeners: data.realtimeListeners,
          alerts: data.alerts,
          performanceStatus: data.performanceStatus
        },
        detailedOperations: allOperations.map(op => ({
          id: op.id,
          timestamp: new Date(op.timestamp).toISOString(),
          type: op.type,
          collection: op.collection,
          resultCount: op.resultCount,
          details: op.details,
          category: op.category,
          cost: op.cost,
          sessionTime: op.sessionTime,
          timeAgo: formatTimeAgo(op.timestamp)
        })),
        analytics: {
          operationsByType: {},
          operationsByCollection: {},
          operationsByMinute: {},
          costBreakdown: {}
        }
      };
      
      // Calculate analytics
      allOperations.forEach(op => {
        // By type
        exportData.analytics.operationsByType[op.type] = 
          (exportData.analytics.operationsByType[op.type] || 0) + 1;
        
        // By collection
        exportData.analytics.operationsByCollection[op.collection] = 
          (exportData.analytics.operationsByCollection[op.collection] || 0) + 1;
        
        // By minute (for trend analysis)
        const minute = new Date(op.timestamp).toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
        exportData.analytics.operationsByMinute[minute] = 
          (exportData.analytics.operationsByMinute[minute] || 0) + 1;
        
        // Cost breakdown
        if (op.cost > 0) {
          exportData.analytics.costBreakdown[op.collection] = 
            (exportData.analytics.costBreakdown[op.collection] || 0) + op.cost;
        }
      });
      
      // Create and download file as TXT with JSON content
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `firebase-session-data-${new Date().toISOString().split('T')[0]}-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('📥 Session data exported successfully as TXT:', {
        totalOperations: allOperations.length,
        timeRange: allOperations.length > 0 ? {
          start: new Date(allOperations[allOperations.length - 1].timestamp).toISOString(),
          end: new Date(allOperations[0].timestamp).toISOString()
        } : null
      });
      
    } catch (error) {
      console.error('Error exporting session data:', error);
      alert('Error exporting data. Please check the console for details.');
    }
  };

  // Export as actual JSON file
  const exportAsJSON = () => {
    try {
      // Get all operations from the tracker
      const allOperations = getRecentOperations(1000);
      const fullStats = getStats();
      
      // Create comprehensive export data
      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          sessionDuration: data.sessionDuration,
          totalOperations: data.session.totalOperations,
          exportedOperations: allOperations.length
        },
        summary: {
          session: data.session,
          last5min: data.last5min,
          collections: data.collections,
          realtimeListeners: data.realtimeListeners,
          alerts: data.alerts,
          performanceStatus: data.performanceStatus
        },
        detailedOperations: allOperations.map(op => ({
          id: op.id,
          timestamp: new Date(op.timestamp).toISOString(),
          type: op.type,
          collection: op.collection,
          resultCount: op.resultCount,
          details: op.details,
          category: op.category,
          cost: op.cost,
          sessionTime: op.sessionTime,
          timeAgo: formatTimeAgo(op.timestamp)
        })),
        analytics: {
          operationsByType: {},
          operationsByCollection: {},
          operationsByMinute: {},
          costBreakdown: {}
        }
      };
      
      // Calculate analytics
      allOperations.forEach(op => {
        // By type
        exportData.analytics.operationsByType[op.type] = 
          (exportData.analytics.operationsByType[op.type] || 0) + 1;
        
        // By collection
        exportData.analytics.operationsByCollection[op.collection] = 
          (exportData.analytics.operationsByCollection[op.collection] || 0) + 1;
        
        // By minute (for trend analysis)
        const minute = new Date(op.timestamp).toISOString().substring(0, 16);
        exportData.analytics.operationsByMinute[minute] = 
          (exportData.analytics.operationsByMinute[minute] || 0) + 1;
        
        // Cost breakdown
        if (op.cost > 0) {
          exportData.analytics.costBreakdown[op.collection] = 
            (exportData.analytics.costBreakdown[op.collection] || 0) + op.cost;
        }
      });
      
      // Create and download file as JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `firebase-session-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('📥 Session data exported successfully as JSON:', {
        totalOperations: allOperations.length
      });
      
    } catch (error) {
      console.error('Error exporting JSON data:', error);
      alert('Error exporting JSON data. Please check the console for details.');
    }
  };

  // Generate detailed report
  const generateReport = () => {
    try {
      const allOperations = getRecentOperations(1000);
      
      // Create a human-readable report
      const report = `
FIREBASE DATABASE USAGE REPORT
Generated: ${new Date().toLocaleString()}
Session Duration: ${data.sessionDuration}

=== SUMMARY ===
Total Operations: ${data.session.totalOperations}
Read Operations: ${data.session.totalReads}
Write Operations: ${data.session.totalWrites}
Total Cost: $${data.session.totalCost.toFixed(6)}
Read/Write Ratio: ${data.readWriteRatio}:1

=== RECENT ACTIVITY (Last 5 minutes) ===
Operations: ${data.last5min.operations}
Reads per minute: ${data.last5min.readsPerMinute}
Cost: $${data.last5min.cost.toFixed(6)}

=== TOP COLLECTIONS ===
${data.collections.slice(0, 5).map(col => 
  `${col.name}: ${col.operations} operations, $${col.cost.toFixed(6)}`
).join('\n')}

=== ACTIVE REAL-TIME LISTENERS ===
${data.realtimeListeners.list.map(listener => 
  `${listener.collection}: ${listener.readCount} reads, ${formatDuration(listener.duration)} active`
).join('\n')}

=== ALERTS ===
${data.alerts.map(alert => `${alert.type.toUpperCase()}: ${alert.title} - ${alert.message}`).join('\n')}

=== DETAILED OPERATIONS (Last 50) ===
${allOperations.slice(0, 50).map(op => 
  `${new Date(op.timestamp).toLocaleTimeString()} | ${op.type} | ${op.collection} | ${op.resultCount} docs | ${op.details}`
).join('\n')}
      `;
      
      // Download as text file
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `firebase-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please check the console for details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Technical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <MetricRow label="Operations/minute" value={data.last5min.operations / 5} />
            <MetricRow label="Read operations" value={data.session.totalReads} />
            <MetricRow label="Write operations" value={data.session.totalWrites} />
            <MetricRow label="Active listeners" value={data.realtimeListeners.active} />
            <MetricRow label="Session duration" value={data.sessionDuration} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Collections</h3>
          <div className="space-y-3">
            {data.collections.slice(0, 8).map((collection) => (
              <div key={collection.name} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{collection.name}</span>
                <span className="text-sm font-medium text-gray-900">
                  {collection.operations} ops
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts and Warnings */}
      {data.alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            {data.alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg ${getAlertStyle(alert.type)}`}>
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export & Reports</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={exportSessionData}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download size={16} />
              <span>JSON as TXT</span>
            </button>
            <button 
              onClick={exportAsJSON}
              className="flex items-center space-x-2 px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <BarChart3 size={16} />
              <span>JSON File</span>
            </button>
            <button 
              onClick={generateReport}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 size={16} />
              <span>Text Report</span>
            </button>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>JSON as TXT:</strong> Complete session data in JSON format saved as .txt file (easy to view in any text editor)</p>
            <p><strong>JSON File:</strong> Complete session data as proper .json file for technical analysis and programming</p>
            <p><strong>Text Report:</strong> Human-readable summary report for management review and documentation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatusCard = ({ icon: Icon, title, value, subtitle, color, trend }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-900 border-green-200',
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    orange: 'bg-orange-50 text-orange-900 border-orange-200',
    red: 'bg-red-50 text-red-900 border-red-200',
    gray: 'bg-gray-50 text-gray-900 border-gray-200'
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4 text-red-500" />,
    down: <TrendingDown className="h-4 w-4 text-green-500" />,
    neutral: null
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color] || colorClasses.gray}`}>
      <div className="flex items-center justify-between">
        <Icon className="h-8 w-8" />
        {trendIcons[trend]}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-sm mt-1 opacity-75">{subtitle}</p>
    </div>
  );
};

const FeatureCard = ({ category, operations, cost }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-2">
        <span className="text-2xl">{category.icon}</span>
        <h4 className="font-medium text-gray-900">{category.name}</h4>
      </div>
      <p className="text-sm text-gray-600 mb-3">{category.description}</p>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{operations} operations</span>
        <span className="font-medium text-indigo-600">${cost.toFixed(4)}</span>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);

// Helper Functions
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const formatTimeAgo = (timestamp) => {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

const getPerformanceStatus = (readsPerMinute, alerts) => {
  const hasWarnings = alerts.some(a => a.type === 'warning');
  
  if (hasWarnings || readsPerMinute > 50) {
    return { label: 'High Activity', color: 'orange' };
  } else if (readsPerMinute > 20) {
    return { label: 'Moderate Activity', color: 'blue' };
  } else {
    return { label: 'Normal Activity', color: 'green' };
  }
};

const getCollectionDisplayName = (collection) => {
  const categories = {
    'messages': 'Chat Messages',
    'channels': 'Chat Rooms',
    'users': 'User Profiles',
    'classes': 'Class Management',
    'tasks': 'Task System',
    'enrollments': 'Student Records'
  };
  return categories[collection] || collection;
};

const getOperationIcon = (type) => {
  if (type.includes('READ')) return <Eye className="h-4 w-4" />;
  if (type.includes('WRITE')) return <Database className="h-4 w-4" />;
  if (type.includes('REALTIME')) return <Activity className="h-4 w-4" />;
  return <Database className="h-4 w-4" />;
};

const getOperationColor = (type) => {
  if (type.includes('READ')) return { bg: 'bg-blue-100', text: 'text-blue-600' };
  if (type.includes('WRITE')) return { bg: 'bg-green-100', text: 'text-green-600' };
  if (type.includes('REALTIME')) return { bg: 'bg-purple-100', text: 'text-purple-600' };
  return { bg: 'bg-gray-100', text: 'text-gray-600' };
};

const getOperationDescription = (type) => {
  const descriptions = {
    'READ': 'Retrieved data from database',
    'WRITE': 'Saved data to database',
    'REALTIME_READ': 'Live update received',
    'NETWORK_READ': 'Network data request',
    'NETWORK_WRITE': 'Network data save'
  };
  return descriptions[type] || 'Database operation';
};

const getAlertIcon = (type) => {
  const icons = {
    warning: <AlertTriangle className="h-5 w-5 text-orange-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    success: <CheckCircle className="h-5 w-5 text-green-600" />
  };
  return icons[type] || icons.info;
};

const getAlertStyle = (type) => {
  const styles = {
    warning: 'bg-orange-50 border border-orange-200',
    error: 'bg-red-50 border border-red-200',
    info: 'bg-blue-50 border border-blue-200',
    success: 'bg-green-50 border border-green-200'
  };
  return styles[type] || styles.info;
};

export default ManagerFirebaseDashboard; 