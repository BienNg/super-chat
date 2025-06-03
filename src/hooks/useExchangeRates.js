import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useExchangeRates - Custom hook for fetching real-time exchange rates
 * Uses exchangerate-api.com for free exchange rate data
 */
export const useExchangeRates = (baseCurrency = 'EUR') => {
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasInitialRates = useRef(false);

  // Free API endpoint - no API key required for basic usage
  const API_URL = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;

  const fetchExchangeRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Structure the data for easy access
      const rates = {
        base: data.base,
        rates: data.rates,
        lastUpdated: new Date(data.date),
        // Helper method to get specific rate
        getRate: (from, to) => {
          if (from === to) return 1;
          if (from === data.base) return data.rates[to];
          if (to === data.base) return 1 / data.rates[from];
          // Convert through base currency
          return (data.rates[to] / data.rates[from]);
        }
      };
      
      setExchangeRates(rates);
      setLastUpdated(new Date());
      setError(null);
      hasInitialRates.current = true;
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError(err.message);
      
      // Fallback to cached rates or static rates only if we don't have any rates yet
      if (!hasInitialRates.current) {
        // Set fallback static rates if no previous data
        setExchangeRates({
          base: baseCurrency,
          rates: {
            'EUR': baseCurrency === 'EUR' ? 1 : 0.92,
            'USD': baseCurrency === 'USD' ? 1 : 1.08,
            'VND': baseCurrency === 'VND' ? 1 : 26000,
            'GBP': 0.87,
            'JPY': 140
          },
          lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          getRate: function(from, to) {
            if (from === to) return 1;
            if (from === this.base) return this.rates[to];
            if (to === this.base) return 1 / this.rates[from];
            return (this.rates[to] / this.rates[from]);
          },
          isStale: true
        });
        hasInitialRates.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL, baseCurrency]); // Removed exchangeRates.rates dependency

  // Fetch rates on mount and when base currency changes
  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchExchangeRates();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [fetchExchangeRates, loading]);

  // Helper function to format exchange rate display
  const getExchangeRateDisplay = useCallback((fromCurrency, toCurrency) => {
    if (!exchangeRates.getRate) return 'Loading...';
    
    const rate = exchangeRates.getRate(fromCurrency, toCurrency);
    
    if (rate >= 1) {
      return `1 ${fromCurrency} = ${rate.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })} ${toCurrency}`;
    } else {
      return `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`;
    }
  }, [exchangeRates]);

  // Helper function to get time since last update
  const getUpdateTimeDisplay = useCallback(() => {
    if (!lastUpdated) return 'Never updated';
    
    const now = new Date();
    const diffMinutes = Math.floor((now - lastUpdated) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }, [lastUpdated]);

  return {
    exchangeRates,
    loading,
    error,
    lastUpdated,
    refreshRates: fetchExchangeRates,
    getExchangeRateDisplay,
    getUpdateTimeDisplay,
    isStale: exchangeRates.isStale || false
  };
}; 