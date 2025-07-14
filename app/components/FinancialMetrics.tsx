import React from 'react';
import { DollarSign } from 'lucide-react';

interface FinancialData {
  totalCash?: number;
  totalDebt?: number;
  totalRevenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  freeCashFlow?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  profitMargins?: number;
  operatingMargins?: number;
  grossMargins?: number;
  currentRatio?: number;
  quickRatio?: number;
  debtToEquity?: number;
  priceToBook?: number;
  priceToSales?: number;
  earningsGrowth?: number;
  revenueGrowth?: number;
}

interface FinancialMetricsProps {
  financialData: FinancialData;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ financialData }) => {
  const formatNumber = (num: number | null | undefined): string => {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (num: number | null | undefined): string => {
    if (!num || isNaN(num)) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatRatio = (num: number | null | undefined): string => {
    if (!num || isNaN(num)) return 'N/A';
    return num.toFixed(2);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-green-400" />
        <h3 className="text-xl font-semibold">Financial Metrics</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Revenue & Profitability */}
        <div>
          <h4 className="text-lg font-medium mb-3 text-blue-400">Revenue & Profitability</h4>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="font-semibold">{formatNumber(financialData.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Gross Profit</p>
              <p className="font-semibold">{formatNumber(financialData.grossProfit)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Operating Income</p>
              <p className="font-semibold">{formatNumber(financialData.operatingIncome)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Net Income</p>
              <p className="font-semibold">{formatNumber(financialData.netIncome)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Free Cash Flow</p>
              <p className="font-semibold">{formatNumber(financialData.freeCashFlow)}</p>
            </div>
          </div>
        </div>

        {/* Margins & Returns */}
        <div>
          <h4 className="text-lg font-medium mb-3 text-green-400">Margins & Returns</h4>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Gross Margin</p>
              <p className="font-semibold">{formatPercentage(financialData.grossMargins)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Operating Margin</p>
              <p className="font-semibold">{formatPercentage(financialData.operatingMargins)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Profit Margin</p>
              <p className="font-semibold">{formatPercentage(financialData.profitMargins)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Return on Equity</p>
              <p className="font-semibold">{formatPercentage(financialData.returnOnEquity)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Return on Assets</p>
              <p className="font-semibold">{formatPercentage(financialData.returnOnAssets)}</p>
            </div>
          </div>
        </div>

        {/* Ratios & Valuation */}
        <div>
          <h4 className="text-lg font-medium mb-3 text-purple-400">Ratios & Valuation</h4>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Current Ratio</p>
              <p className="font-semibold">{formatRatio(financialData.currentRatio)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Quick Ratio</p>
              <p className="font-semibold">{formatRatio(financialData.quickRatio)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Debt to Equity</p>
              <p className="font-semibold">{formatRatio(financialData.debtToEquity)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Price to Book</p>
              <p className="font-semibold">{formatRatio(financialData.priceToBook)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Price to Sales</p>
              <p className="font-semibold">{formatRatio(financialData.priceToSales)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth & Cash */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <h4 className="text-lg font-medium mb-3 text-yellow-400">Growth</h4>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Revenue Growth</p>
              <p className="font-semibold">{formatPercentage(financialData.revenueGrowth)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Earnings Growth</p>
              <p className="font-semibold">{formatPercentage(financialData.earningsGrowth)}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-medium mb-3 text-cyan-400">Cash & Debt</h4>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Total Cash</p>
              <p className="font-semibold">{formatNumber(financialData.totalCash)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Debt</p>
              <p className="font-semibold">{formatNumber(financialData.totalDebt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
)}