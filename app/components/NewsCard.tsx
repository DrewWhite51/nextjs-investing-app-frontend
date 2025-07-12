import type React from "react"
import {
  Building2,
  TrendingUp,
  Clock,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Factory,
  FileText,
  Target,
  Shield,
} from "lucide-react"

// TypeScript interfaces
interface ParsedSummary {
  summary: string
  investment_implications: string
  sentiment: string
  time_horizon: string
  confidence_score: number
  key_metrics: string[]
  companies_mentioned: string[]
  sectors_affected: string[]
  risk_factors: string[]
  opportunities: string[]
}

interface Summary {
  id: number
  source_file: string
  processed_at: string
  model_used: string
  parsed_summary: ParsedSummary
  processed_datetime: Date | null
}

interface NewsCardProps {
  summary: Summary
}

const NewsCard: React.FC<NewsCardProps> = ({ summary }) => {
  const getSentimentConfig = (sentiment: string | null | undefined) => {
    if (!sentiment)
      return {
        color: "bg-slate-500",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        textColor: "text-slate-700",
      }

    switch (sentiment.toLowerCase()) {
      case "positive":
        return {
          color: "bg-emerald-500",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          textColor: "text-emerald-700",
        }
      case "negative":
        return {
          color: "bg-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-700",
        }
      case "neutral":
        return {
          color: "bg-amber-500",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-700",
        }
      default:
        return {
          color: "bg-slate-500",
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200",
          textColor: "text-slate-700",
        }
    }
  }

  const getConfidenceConfig = (confidence: number | null | undefined) => {
    if (!confidence) return { color: "bg-slate-500", label: "Unknown" }
    if (confidence >= 0.8) return { color: "bg-emerald-500", label: "High" }
    if (confidence >= 0.6) return { color: "bg-amber-500", label: "Medium" }
    return { color: "bg-red-500", label: "Low" }
  }

  const formatTimeAgo = (dateString: string | null | undefined): string => {
    if (!dateString) return "Unknown time"
    const now = new Date()
    const date = new Date(dateString)
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} ago`
    if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} ago`
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
    return "Just now"
  }

  const sentimentConfig = getSentimentConfig(summary.parsed_summary.sentiment)
  const confidenceConfig = getConfidenceConfig(summary.parsed_summary.confidence_score)

  return (
    <div
      className={`group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${sentimentConfig.bgColor} ${sentimentConfig.borderColor} border-2 rounded-xl bg-white shadow-lg`}
    >
      {/* Card Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Sentiment Badge */}
              <span
                className={`${sentimentConfig.color} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm`}
              >
                {summary.parsed_summary.sentiment
                  ? summary.parsed_summary.sentiment.charAt(0).toUpperCase() + summary.parsed_summary.sentiment.slice(1)
                  : "Unknown"}
              </span>

              {/* Confidence Badge */}
              {summary.parsed_summary.confidence_score && (
                <span
                  className={`${confidenceConfig.color} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm`}
                >
                  {Math.round(summary.parsed_summary.confidence_score * 100)}% {confidenceConfig.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{formatTimeAgo(summary.processed_at)}</span>
          </div>
        </div>

        {summary.parsed_summary.time_horizon && (
          <div className="flex items-center gap-2 mt-4">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {summary.parsed_summary.time_horizon.charAt(0).toUpperCase() +
                summary.parsed_summary.time_horizon.slice(1)}{" "}
              Horizon
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-6">
        {/* Executive Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-lg">Executive Summary</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{summary.parsed_summary.summary || "No summary available"}</p>
        </div>

        {/* Investment Implications */}
        {summary.parsed_summary.investment_implications && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900 text-lg">Investment Implications</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{summary.parsed_summary.investment_implications}</p>
          </div>
        )}

        {/* Companies and Sectors Grid */}
        {(summary.parsed_summary.companies_mentioned?.length > 0 ||
          summary.parsed_summary.sectors_affected?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Companies */}
            {summary.parsed_summary.companies_mentioned?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Companies</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.parsed_summary.companies_mentioned.map((company: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sectors */}
            {summary.parsed_summary.sectors_affected?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Factory className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Sectors</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.parsed_summary.sectors_affected.map((sector: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Metrics */}
        {summary.parsed_summary.key_metrics?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Key Metrics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.parsed_summary.key_metrics.map((metric: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  {metric}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Risk & Opportunity Analysis */}
        {(summary.parsed_summary.risk_factors?.length > 0 || summary.parsed_summary.opportunities?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Factors */}
            {summary.parsed_summary.risk_factors?.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">Risk Factors</h4>
                </div>
                <div className="space-y-2">
                  {summary.parsed_summary.risk_factors.slice(0, 3).map((risk: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-red-800">
                      <Shield className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                      <span>{risk}</span>
                    </div>
                  ))}
                  {summary.parsed_summary.risk_factors.length > 3 && (
                    <div className="text-red-700 text-xs font-medium mt-2 pl-6">
                      +{summary.parsed_summary.risk_factors.length - 3} additional risks
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {summary.parsed_summary.opportunities?.length > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900">Opportunities</h4>
                </div>
                <div className="space-y-2">
                  {summary.parsed_summary.opportunities.slice(0, 3).map((opportunity: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-emerald-800">
                      <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                      <span>{opportunity}</span>
                    </div>
                  ))}
                  {summary.parsed_summary.opportunities.length > 3 && (
                    <div className="text-emerald-700 text-xs font-medium mt-2 pl-6">
                      +{summary.parsed_summary.opportunities.length - 3} additional opportunities
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsCard
