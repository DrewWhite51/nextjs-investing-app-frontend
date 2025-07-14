import React from 'react';
import { Award } from 'lucide-react';

interface FinancialData {
  recommendationMean?: number;
  recommendationKey?: string;
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  numberOfAnalystOpinions?: number;
}

interface AnalystRecommendationsProps {
  financialData: FinancialData;
}

export const AnalystRecommendations: React.FC<AnalystRecommendationsProps> = ({ financialData }) => {
  const formatNumber = (num: number | null | undefined): string => {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getRecommendationText = (mean: number | undefined): string => {
    if (!mean) return 'N/A';
    if (mean <= 1.5) return 'Strong Buy';
    if (mean <= 2.5) return 'Buy';
    if (mean <= 3.5) return 'Hold';
    if (mean <= 4.5) return 'Sell';
    return 'Strong Sell';
  };

  const getRecommendationColor = (mean: number | undefined): string => {
    if (!mean) return 'text-gray-400';
    if (mean <= 1.5) return 'text-green-400';
    if (mean <= 2.5) return 'text-blue-400';
    if (mean <= 3.5) return 'text-yellow-400';
    if (mean <= 4.5) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-5 h-5 text-yellow-400" />
        <h3 className="text-xl font-semibold">Analyst Recommendations</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <p className="text-gray-400 text-sm">Recommendation</p>
          <p className={`font-semibold text-lg ${getRecommendationColor(financialData.recommendationMean)}`}>
            {getRecommendationText(financialData.recommendationMean)}
          </p>
          <p className="text-gray-500 text-xs">
            Score: {financialData.recommendationMean?.toFixed(2) || 'N/A'}
          </p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm">Analysts</p>
          <p className="font-semibold">{financialData.numberOfAnalystOpinions || 'N/A'}</p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm">Target Price</p>
          <p className="font-semibold">{formatNumber(financialData.targetMeanPrice)}</p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm">Price Range</p>
          <p className="font-semibold text-sm">
            {formatNumber(financialData.targetLowPrice)} - {formatNumber(financialData.targetHighPrice)}
          </p>
        </div>
      </div>
    </div>
  );
};