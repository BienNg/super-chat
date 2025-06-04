import React, { useState } from 'react';
import { useAdvancedSupabaseMonitor } from '../../../contexts/AdvancedSupabaseMonitorContext';
import { getRecentOperations, getStats } from '../../../utils/comprehensiveSupabaseTracker';
import { usePermissions } from '../../../hooks/usePermissions';

const ManagerQuickStatus = () => {
  const { stats, isActive } = useAdvancedSupabaseMonitor();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const { isAdmin } = usePermissions();

  // Only render for admins
  if (!isAdmin) {
    return null;
  }

  if (!isActive || !stats) {
    return (
      <div className="fixed top-4 right-4 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm z-50">
        📊 Database Monitor: Inactive
      </div>
    );
  }

  const { last5min } = stats;
  const readsPerMin = last5min.readsPerMinute || 0;

  // Determine status color based on activity level
  let statusColor = 'bg-green-100 text-green-800';
  let statusIcon = '🟢';
  
  if (readsPerMin > 50) {
    statusColor = 'bg-red-100 text-red-800';
    statusIcon = '🔴';
  } else if (readsPerMin > 20) {
    statusColor = 'bg-orange-100 text-orange-800';
    statusIcon = '🟡';
  } else if (readsPerMin > 5) {
    statusColor = 'bg-blue-100 text-blue-800';
    statusIcon = '🔵';
  }

  const handleDebugClick = () => {
    console.log('🐛 Debug mode enabled! Check console for detailed Supabase tracking info.');
    alert('Debug mode enabled! Check browser console for detailed Supabase tracking information.');
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleQuickExport = () => {
    try {
      const allOperations = getRecentOperations(1000);
      const fullStats = getStats();
      
      const quickExportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          type: 'Quick Export',
          totalOperations: allOperations.length
        },
        summary: fullStats,
        operations: allOperations.map(op => ({
          timestamp: new Date(op.timestamp).toISOString(),
          type: op.type,
          collection: op.table || op.collection,
          resultCount: op.resultCount,
          details: op.details,
          cost: op.cost
        }))
      };
      
      const jsonString = JSON.stringify(quickExportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `supabase-quick-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowContextMenu(false);
      console.log('📥 Quick export completed:', allOperations.length, 'operations');
      
    } catch (error) {
      console.error('Quick export failed:', error);
      alert('Export failed. Check console for details.');
    }
  };

  return (
    <div className="relative">
      <div 
        className={`fixed top-4 right-4 ${statusColor} px-3 py-2 rounded-lg text-sm z-50 cursor-pointer group`}
        onClick={handleDebugClick}
        onContextMenu={handleRightClick}
        title="Left click: Debug mode | Right click: Quick actions"
      >
        <div className="flex items-center space-x-2">
          <span>{statusIcon}</span>
          <span className="font-medium">
            {readsPerMin.toFixed(1)} reads/min
          </span>
          <span className="text-xs opacity-75">
            ({last5min.operations} ops)
          </span>
        </div>
        
        {/* Debug hint on hover */}
        <div className="absolute top-full right-0 mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Left: Debug | Right: Export
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowContextMenu(false)}
          />
          
          {/* Menu */}
          <div className="fixed top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 min-w-48">
            <button
              onClick={handleDebugClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>🐛</span>
              <span>Enable Debug Mode</span>
            </button>
            <button
              onClick={handleQuickExport}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Quick Export JSON</span>
            </button>
            <div className="border-t border-gray-200 my-1" />
            <div className="px-4 py-2 text-xs text-gray-500">
              {stats.session.totalOperations} total operations
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerQuickStatus; 