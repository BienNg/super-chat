import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';

/**
 * RevenueChart - Displays revenue trends over time
 * Currently shows a placeholder, can be enhanced with actual charting library
 */
const RevenueChart = ({ currency = 'EUR' }) => {
  const [timeRange, setTimeRange] = useState('7days');

  const timeRangeOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: '1year', label: 'Last Year' }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Chart Placeholder */}
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-lg font-medium">Chart Placeholder</p>
          <p className="text-sm">
            Revenue chart for {timeRangeOptions.find(opt => opt.value === timeRange)?.label.toLowerCase()}
          </p>
          <p className="text-xs mt-2">
            Integration with Chart.js or similar library coming soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart; 