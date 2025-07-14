'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity, Search, Calendar, DollarSign, Building } from 'lucide-react';

// Import your component files
import { FinancialMetrics } from './FinancialMetrics';
import { CompanyProfile } from './CompanyProfile';
import { AnalystRecommendations } from './AnalystRecommendations';
import { ApexCandlestickChart } from './ApexCandlestickChart';

// Interfaces
interface ChartDataItem {
  date: string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume?: number | string;
}

interface StockData {
  shortName?: string;
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  marketCap?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  trailingPE?: number;
  dividendYield?: number;
  currency?: string;
  marketState?: string;
  averageVolume?: number;
}

interface StockApiResponse {
  stock: StockData | null;
  chartData: ChartDataItem[];
  companyInfo: any;
}

// Main Stock Dashboard Component
const StockDashboard: React.FC = () => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [inputSymbol, setInputSymbol] = useState<string>('AAPL');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [period, setPeriod] = useState<string>('1mo');
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'company'>('overview');

  // Fetch stock data
  const fetchStockData = async (stockSymbol: string, timePeriod: string = '1mo'): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stock/${stockSymbol}?period=${timePeriod}`);
      
      if (!response.ok) {
        const errorData: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch data`);
      }
      
      const data: StockApiResponse = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data received from API');
      }
      
      setStockData(data.stock || null);
      setChartData(Array.isArray(data.chartData) ? data.chartData : []);
      setCompanyInfo(data.companyInfo || null);
    } catch (err: any) {
      console.error('Error fetching stock data:', err);
      setError(err.message || 'An unexpected error occurred');
      setStockData(null);
      setChartData([]);
      setCompanyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchStockData(symbol, period);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    
    loadInitialData();
  }, []);

  // Handle search
  const handleSearch = async (): Promise<void> => {
    if (inputSymbol && inputSymbol.trim()) {
      const cleanSymbol = inputSymbol.toUpperCase().trim();
      setSymbol(cleanSymbol);
      await fetchStockData(cleanSymbol, period);
    }
  };

  // Handle period change
  const handlePeriodChange = async (newPeriod: string): Promise<void> => {
    setPeriod(newPeriod);
    if (symbol) {
      await fetchStockData(symbol, newPeriod);
    }
  };

  // Format large numbers
  const formatNumber = (num: number | null | undefined): string => {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (num: number | null | undefined): string => {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const safePriceFormat = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    return value.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Stock Market Dashboard</h1>
          
          {/* Search Section */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g., AAPL, TSLA)"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !inputSymbol.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>

          {/* Period Selection */}
          <div className="flex gap-2 mb-6">
            <Calendar className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex gap-2 flex-wrap">
              {['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  disabled={loading}
                  className={`px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 ${
                    period === p 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'financials'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Financials
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'company'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Company
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-200">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-300 hover:text-red-100 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stock Info Card */}
        {stockData && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{stockData.shortName || stockData.symbol || 'Unknown'}</h2>
                <p className="text-gray-400 text-sm">{stockData.symbol || 'N/A'}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Market {stockData.marketState || 'Status Unknown'} • {stockData.currency || 'USD'}
                </p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-3xl font-bold">
                  ${safePriceFormat(stockData.regularMarketPrice)}
                </div>
                <div className={`flex items-center justify-end gap-1 ${
                  (stockData.regularMarketChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(stockData.regularMarketChange || 0) >= 0 ? 
                    <TrendingUp className="w-4 h-4" /> : 
                    <TrendingDown className="w-4 h-4" />
                  }
                  <span>
                    {safePriceFormat(stockData.regularMarketChange)}
                    {' '}
                    ({safePriceFormat(stockData.regularMarketChangePercent)}%)
                  </span>
                </div>
              </div>
            </div>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Market Cap</p>
                <p className="font-semibold">{formatNumber(stockData.marketCap)}</p>
              </div>
              <div>
                <p className="text-gray-400">Volume</p>
                <p className="font-semibold">{formatVolume(stockData.regularMarketVolume)}</p>
              </div>
              <div>
                <p className="text-gray-400">Avg Volume</p>
                <p className="font-semibold">{formatVolume(stockData.averageVolume)}</p>
              </div>
              <div>
                <p className="text-gray-400">P/E Ratio</p>
                <p className="font-semibold">{stockData.trailingPE ? stockData.trailingPE.toFixed(2) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400">Dividend Yield</p>
                <p className="font-semibold">{stockData.dividendYield ? (stockData.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <p className="text-gray-400">52W High</p>
                <p className="font-semibold">${safePriceFormat(stockData.fiftyTwoWeekHigh)}</p>
              </div>
              <div>
                <p className="text-gray-400">52W Low</p>
                <p className="font-semibold">${safePriceFormat(stockData.fiftyTwoWeekLow)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Chart Section */}
            {chartData && chartData.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                {/* Chart Type Toggle */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Price Chart</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartType('line')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        chartType === 'line' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      Line Chart
                    </button>
                    <button
                      onClick={() => setChartType('candlestick')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        chartType === 'candlestick' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Candlestick
                    </button>
                  </div>
                </div>

                {/* Chart Container */}
                <div className="h-96">
                  {chartType === 'line' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            try {
                              return new Date(value).toLocaleDateString();
                            } catch {
                              return value;
                            }
                          }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fontSize: 12 }}
                          domain={['dataMin - 5', 'dataMax + 5']}
                          tickFormatter={(value) => `$${Number(value || 0).toFixed(2)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#f9fafb'
                          }}
                          formatter={(value) => [`$${Number(value || 0).toFixed(2)}`, 'Close Price']}
                          labelFormatter={(label) => {
                            try {
                              return new Date(label).toLocaleDateString();
                            } catch {
                              return label;
                            }
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#3b82f6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <ApexCandlestickChart data={chartData} />
                  )}
                </div>

                {/* Volume Chart */}
                <div className="mt-6 h-32">
                  <h4 className="text-lg font-medium mb-3">Volume</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => {
                          try {
                            return new Date(value).toLocaleDateString();
                          } catch {
                            return value;
                          }
                        }}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => formatVolume(value)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        formatter={(value) => [formatVolume(Number(value)), 'Volume']}
                        labelFormatter={(label) => {
                          try {
                            return new Date(label).toLocaleDateString();
                          } catch {
                            return label;
                          }
                        }}
                      />
                      <Bar dataKey="volume" fill="#6b7280" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Analyst Recommendations */}
            {companyInfo?.financialData && (
              <AnalystRecommendations financialData={companyInfo.financialData} />
            )}
          </>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && companyInfo?.financialData && (
          <FinancialMetrics financialData={companyInfo.financialData} />
        )}

        {/* Company Tab */}
        {activeTab === 'company' && companyInfo?.summaryProfile && (
          <CompanyProfile profile={companyInfo.summaryProfile} />
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && (!stockData || !chartData.length) && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No stock data available. Try searching for a stock symbol.</p>
            </div>
          </div>
        )}

        {/* Missing Data Messages */}
        {!loading && stockData && (
          <>
            {activeTab === 'financials' && !companyInfo?.financialData && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-center text-gray-400">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Financial data not available for this stock.</p>
                </div>
              </div>
            )}

            {activeTab === 'company' && !companyInfo?.summaryProfile && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-center text-gray-400">
                  <Building className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Company profile not available for this stock.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StockDashboard;