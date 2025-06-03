import React from 'react';
import { TrendingUp, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { usePayments } from '../../hooks/usePayments';
import { useExchangeRates } from '../../hooks/useExchangeRates';

/**
 * FinancialOverview - Displays key financial metrics in card format
 * Shows total revenue, monthly revenue, and exchange rates
 */
const FinancialOverview = ({ currency = 'EUR' }) => {
  const { loading: paymentsLoading, getFinancialStats } = usePayments();
  const { 
    loading: ratesLoading, 
    error: ratesError,
    refreshRates,
    getExchangeRateDisplay,
    getUpdateTimeDisplay,
    isStale
  } = useExchangeRates(currency);
  
  // Get financial statistics
  const stats = getFinancialStats(currency);

  const formatCurrency = (amount, curr = currency) => {
    const formatters = {
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      'VND': new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    };
    
    return formatters[curr]?.format(amount) || `${curr} ${amount.toLocaleString()}`;
  };

  // Determine target currency for exchange rate display
  const getTargetCurrency = () => {
    switch (currency) {
      case 'EUR': return 'VND';
      case 'VND': return 'EUR';
      case 'USD': return 'EUR';
      default: return 'USD';
    }
  };

  const targetCurrency = getTargetCurrency();

  if (paymentsLoading) {
    return (
      <div className="grid grid-cols-3 gap-6 p-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* Total Revenue */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <span className="text-green-500">
            <TrendingUp className="h-5 w-5" />
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalRevenue)}
          </span>
          <span className="ml-2 text-sm text-green-500">+{stats.totalGrowthPercent}%</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">vs. previous period</div>
      </div>
      
      {/* Monthly Revenue */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
          <span className="text-green-500">
            <TrendingUp className="h-5 w-5" />
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.monthlyRevenue)}
          </span>
          <span className="ml-2 text-sm text-green-500">+{stats.monthlyGrowthPercent}%</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">vs. previous month</div>
      </div>
      

      {/* Exchange Rate */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 flex items-center">
            Exchange Rate
            {ratesError && (
              <AlertTriangle className="h-3 w-3 text-red-500 ml-1" title={`Error: ${ratesError}`} />
            )}
            {isStale && (
              <WifiOff className="h-3 w-3 text-yellow-500 ml-1" title="Using cached data" />
            )}
          </h3>
          <button 
            onClick={refreshRates}
            disabled={ratesLoading}
            className={`transition-colors ${ratesLoading ? 'text-gray-400' : 'text-blue-500 hover:text-blue-600'}`}
            title="Refresh exchange rates"
          >
            <RefreshCw className={`h-5 w-5 ${ratesLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-baseline">
          {ratesLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {getExchangeRateDisplay(currency, targetCurrency)}
            </span>
          )}
        </div>
        <div className={`text-xs mt-1 flex items-center ${ratesError ? 'text-red-500' : isStale ? 'text-yellow-600' : 'text-gray-500'}`}>
          {ratesError ? (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              Failed to update
            </>
          ) : (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              {getUpdateTimeDisplay()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview; 