// hooks/useStockData.js
import { useState, useEffect, useCallback } from 'react';

export const useStockData = (initialSymbol = 'AAPL') => {
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState(initialSymbol);

  const fetchStockData = useCallback(async (stockSymbol, period = '1mo', interval = '1d') => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        period,
        interval
      });
      
      const response = await fetch(`/api/stock/${stockSymbol}?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      setStockData(data.stock);
      setChartData(data.chartData);
      setSymbol(stockSymbol);
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      setStockData(null);
      setChartData([]);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchStockData(initialSymbol);
  }, [fetchStockData, initialSymbol]);

  // Refresh current data
  const refresh = useCallback(() => {
    if (symbol) {
      return fetchStockData(symbol);
    }
  }, [fetchStockData, symbol]);

  // Search for new symbol
  const searchSymbol = useCallback((newSymbol, period = '1mo') => {
    if (newSymbol && newSymbol.trim()) {
      return fetchStockData(newSymbol.toUpperCase(), period);
    }
    return Promise.resolve({ success: false, error: 'Symbol is required' });
  }, [fetchStockData]);

  // Change time period for current symbol
  const changePeriod = useCallback((period) => {
    if (symbol) {
      return fetchStockData(symbol, period);
    }
  }, [fetchStockData, symbol]);

  return {
    // Data
    stockData,
    chartData,
    symbol,
    
    // State
    loading,
    error,
    
    // Actions
    fetchStockData,
    searchSymbol,
    changePeriod,
    refresh,
    
    // Utilities
    hasData: !!stockData && chartData.length > 0,
    clearError: () => setError(null)
  };
};

// Custom hook for managing chart type and display options
export const useChartSettings = () => {
  const [chartType, setChartType] = useState('line'); // 'line' or 'candlestick'
  const [showVolume, setShowVolume] = useState(true);
  const [period, setPeriod] = useState('1mo');

  const toggleChartType = useCallback(() => {
    setChartType(prev => prev === 'line' ? 'candlestick' : 'line');
  }, []);

  const toggleVolume = useCallback(() => {
    setShowVolume(prev => !prev);
  }, []);

  return {
    chartType,
    showVolume,
    period,
    setChartType,
    setShowVolume,
    setPeriod,
    toggleChartType,
    toggleVolume
  };
};