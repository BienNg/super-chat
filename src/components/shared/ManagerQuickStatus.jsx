import React from 'react';
import { Activity, AlertTriangle, DollarSign, Database } from 'lucide-react';
import { useAdvancedSupabaseMonitor } from '../../contexts/AdvancedSupabaseMonitorContext';
import { usePermissions } from '../../hooks/usePermissions';

const ManagerQuickStatus = () => {
  const { quickStatus, hasAlerts, toggleDashboard } = useAdvancedSupabaseMonitor();
  const { isAdmin } = usePermissions();

  // Only render for admins
  if (!isAdmin) {
    return null;
  }

  const getStatusColor = (color) => {
    const colors = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      gray: 'bg-gray-500'
    };
    return colors[color] || colors.gray;
  };

  const getStatusIcon = () => {
    if (hasAlerts) return <AlertTriangle className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <button
      onClick={toggleDashboard}
      className={`fixed top-4 right-4 bg-white rounded-lg shadow-lg border-l-4 p-3 transition-all hover:shadow-xl z-40 ${
        hasAlerts ? 'border-orange-500' : 'border-green-500'
      }`}
      title="Click to open Database Monitor"
    >
      <div className="flex items-center space-x-3">
        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full ${getStatusColor(quickStatus.color)} ${
          hasAlerts ? 'animate-pulse' : ''
        }`}></div>
        
        {/* Status Text */}
        <div className="text-left">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-900">
              {quickStatus.status}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {quickStatus.reads} reads • ${quickStatus.cost.toFixed(4)}
          </div>
        </div>

        {/* Alert Badge */}
        {hasAlerts && (
          <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            !
          </div>
        )}
      </div>
    </button>
  );
};

export default ManagerQuickStatus; 