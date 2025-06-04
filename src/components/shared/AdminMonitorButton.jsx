import React, { useState } from 'react';
import { useDeveloperMonitor } from '../../contexts/AdvancedSupabaseMonitorContext';

const AdminMonitorButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { stats, operations } = useDeveloperMonitor();

  // Simple display of current stats
  const sessionSummary = stats ? {
    totalOperations: stats.session?.totalOperations || 0,
    totalReads: stats.session?.totalReads || 0,
    totalWrites: stats.session?.totalWrites || 0,
    totalCost: stats.session?.totalCost || 0
  } : null;

  if (!sessionSummary) {
    return (
      <div className="fixed bottom-4 left-4 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm">
        Loading monitor...
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Developer Monitor</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      <div className="space-y-1 text-gray-600">
        <div>Operations: {sessionSummary.totalOperations}</div>
        <div>Reads: {sessionSummary.totalReads}</div>
        <div>Writes: {sessionSummary.totalWrites}</div>
        <div>Cost: ${sessionSummary.totalCost.toFixed(4)}</div>
      </div>

      {isExpanded && operations && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Recent Operations</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {operations.slice(0, 5).map((op) => (
              <div key={op.id} className="text-xs text-gray-500">
                {op.type} on {op.table || op.collection}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitorButton; 