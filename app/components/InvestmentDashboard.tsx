'use client'
import { useState, useEffect, useMemo } from 'react'

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

interface Stats {
  total_summaries: number
  sentiments: {
    positive: number
    negative: number
    neutral: number
  }
  avg_confidence: number
}

interface DashboardData {
  summaries: Summary[]
  stats: Stats
}

interface Filters {
  sentiment: string
  timeHorizon: string
  search: string
}

interface ApiResponse {
  success: boolean
  data: DashboardData
}

const ITEMS_PER_PAGE = 9

export default function InvestmentDashboard(): JSX.Element {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [filters, setFilters] = useState<Filters>({
    sentiment: '',
    timeHorizon: '',
    search: ''
  })

  // Fetch dashboard data only once on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        setDashboardData(result.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Client-side filtering
  const filteredSummaries = useMemo(() => {
    if (!dashboardData?.summaries) return []
    
    return dashboardData.summaries.filter(summary => {
      // Sentiment filter
      if (filters.sentiment && summary.parsed_summary.sentiment?.toLowerCase() !== filters.sentiment.toLowerCase()) {
        return false
      }
      
      // Time horizon filter
      if (filters.timeHorizon && summary.parsed_summary.time_horizon?.toLowerCase() !== filters.timeHorizon.toLowerCase()) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          summary.parsed_summary.summary,
          summary.parsed_summary.investment_implications,
          ...(summary.parsed_summary.companies_mentioned || []),
          ...(summary.parsed_summary.sectors_affected || []),
          ...(summary.parsed_summary.key_metrics || []),
          summary.source_file
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }
      
      return true
    })
  }, [dashboardData?.summaries, filters])

  // Pagination logic
  const totalPages = Math.ceil(filteredSummaries.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedSummaries = filteredSummaries.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    if (!filteredSummaries.length) {
      return {
        total_summaries: 0,
        sentiments: { positive: 0, negative: 0, neutral: 0 },
        avg_confidence: 0
      }
    }

    const sentimentCounts = filteredSummaries.reduce((acc, summary) => {
      const sentiment = summary.parsed_summary.sentiment?.toLowerCase()
      if (sentiment === 'positive') acc.positive++
      else if (sentiment === 'negative') acc.negative++
      else if (sentiment === 'neutral') acc.neutral++
      return acc
    }, { positive: 0, negative: 0, neutral: 0 })

    const avgConfidence = Math.round(
      filteredSummaries.reduce((sum, summary) => sum + (summary.parsed_summary.confidence_score || 0), 0) / filteredSummaries.length * 100
    )

    return {
      total_summaries: filteredSummaries.length,
      sentiments: sentimentCounts,
      avg_confidence: avgConfidence
    }
  }, [filteredSummaries])

  const clearFilters = (): void => {
    setFilters({ sentiment: '', timeHorizon: '', search: '' })
    setCurrentPage(1)
  }

  const getSentimentColor = (sentiment: string | null | undefined): string => {
    if (!sentiment) return 'bg-slate-400'
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-emerald-500'
      case 'negative': return 'bg-rose-500'
      case 'neutral': return 'bg-amber-500'
      default: return 'bg-slate-400'
    }
  }

  const getSentimentBg = (sentiment: string | null | undefined): string => {
    if (!sentiment) return 'bg-slate-50 border-slate-200'
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-emerald-50 border-emerald-200'
      case 'negative': return 'bg-rose-50 border-rose-200'
      case 'neutral': return 'bg-amber-50 border-amber-200'
      default: return 'bg-slate-50 border-slate-200'
    }
  }

  const getConfidenceColor = (confidence: number | null | undefined): string => {
    if (!confidence) return 'bg-slate-400'
    if (confidence >= 0.8) return 'bg-emerald-500'
    if (confidence >= 0.6) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  const formatTimeAgo = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Unknown time'
    
    const now = new Date()
    const date = new Date(dateString)
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    // Smooth scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="text-center">
          <div className="text-slate-300 text-8xl mb-6">📭</div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">No Data Available</h3>
          <p className="text-slate-500">Unable to load dashboard data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Investment Dashboard</h1>
          <p className="text-slate-600">Monitor and analyze your investment summaries</p>
        </div>

        {/* Statistics Row - showing filtered stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Summaries</p>
                <p className="text-3xl font-bold text-slate-800">{filteredStats.total_summaries}</p>
                {filteredStats.total_summaries !== dashboardData.stats.total_summaries && (
                  <p className="text-xs text-slate-500">of {dashboardData.stats.total_summaries} total</p>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Positive Sentiment</p>
                <p className="text-3xl font-bold text-emerald-600">{filteredStats.sentiments.positive}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📈</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Negative Sentiment</p>
                <p className="text-3xl font-bold text-rose-600">{filteredStats.sentiments.negative}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📉</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Avg Confidence</p>
                <p className="text-3xl font-bold text-blue-600">{filteredStats.avg_confidence}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sentiment</label>
              <select 
                className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                value={filters.sentiment}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
              >
                <option value="">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Time Horizon</label>
              <select 
                className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                value={filters.timeHorizon}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, timeHorizon: e.target.value }))}
              >
                <option value="">All Time Horizons</option>
                <option value="short-term">Short-term</option>
                <option value="medium-term">Medium-term</option>
                <option value="long-term">Long-term</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Search</label>
              <input 
                type="text"
                className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search companies, sectors..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div className="flex items-end">
              <button 
                className="w-full bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl transition-colors font-medium"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count and Pagination Info */}
        {filteredSummaries.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <div className="text-slate-600">
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredSummaries.length)} of {filteredSummaries.length} results
            </div>
            <div className="text-slate-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {paginatedSummaries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-slate-300 text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">
              {filteredSummaries.length === 0 && (filters.sentiment || filters.timeHorizon || filters.search) 
                ? 'No Results Found' 
                : 'No Summaries Available'
              }
            </h3>
            <p className="text-slate-500 mb-4">
              {filteredSummaries.length === 0 && (filters.sentiment || filters.timeHorizon || filters.search)
                ? 'Try adjusting your filters to see more results.'
                : 'Run the pipeline to generate some investment summaries!'
              }
            </p>
            {(filters.sentiment || filters.timeHorizon || filters.search) && (
              <button 
                onClick={clearFilters}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6 mb-8">
              {paginatedSummaries.map((summary) => (
                <div key={summary.id} className={`rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg ${getSentimentBg(summary.parsed_summary.sentiment)}`}>
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${getSentimentColor(summary.parsed_summary.sentiment)}`}>
                          {summary.parsed_summary.sentiment ? summary.parsed_summary.sentiment.charAt(0).toUpperCase() + summary.parsed_summary.sentiment.slice(1) : 'Unknown'}
                        </span>
                        
                        {summary.parsed_summary.confidence_score && (
                          <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${getConfidenceColor(summary.parsed_summary.confidence_score)}`}>
                            {Math.round(summary.parsed_summary.confidence_score * 100)}%
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-slate-500">
                        {formatTimeAgo(summary.processed_at)}
                      </div>
                    </div>
                    
                    {summary.parsed_summary.time_horizon && (
                      <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <span>⏱️</span>
                        <span className="font-medium">{summary.parsed_summary.time_horizon.charAt(0).toUpperCase() + summary.parsed_summary.time_horizon.slice(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-6">
                    {/* Summary */}
                    <div>
                      <h6 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
                        <span className="text-blue-500">📰</span>
                        Summary
                      </h6>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {summary.parsed_summary.summary || 'No summary available'}
                      </p>
                    </div>

                    {/* Investment Implications */}
                    {summary.parsed_summary.investment_implications && (
                      <div>
                        <h6 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
                          <span className="text-emerald-500">💰</span>
                          Investment Implications
                        </h6>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {summary.parsed_summary.investment_implications}
                        </p>
                      </div>
                    )}

                    {/* Companies */}
                    {summary.parsed_summary.companies_mentioned?.length > 0 && (
                      <div>
                        <h6 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
                          <span className="text-blue-500">🏢</span>
                          Companies
                        </h6>
                        <div className="flex flex-wrap gap-2">
                          {summary.parsed_summary.companies_mentioned.map((company: string, idx: number) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sectors */}
                    {summary.parsed_summary.sectors_affected?.length > 0 && (
                      <div>
                        <h6 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
                          <span className="text-purple-500">🏭</span>
                          Sectors
                        </h6>
                        <div className="flex flex-wrap gap-2">
                          {summary.parsed_summary.sectors_affected.map((sector: string, idx: number) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                              {sector}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Metrics */}
                    {summary.parsed_summary.key_metrics?.length > 0 && (
                      <div>
                        <h6 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
                          <span className="text-slate-500">📊</span>
                          Key Metrics
                        </h6>
                        <div className="flex flex-wrap gap-2">
                          {summary.parsed_summary.key_metrics.map((metric: string, idx: number) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risks & Opportunities */}
                    {(summary.parsed_summary.risk_factors?.length > 0 || summary.parsed_summary.opportunities?.length > 0) && (
                      <div className="grid grid-cols-1 gap-4">
                        {summary.parsed_summary.risk_factors?.length > 0 && (
                          <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                            <h6 className="text-rose-700 font-semibold mb-3 flex items-center gap-2">
                              <span>⚠️</span>
                              Risk Factors
                            </h6>
                            <div className="space-y-2">
                              {summary.parsed_summary.risk_factors.slice(0, 3).map((risk: string, idx: number) => (
                                <div key={idx} className="text-rose-700 text-sm flex items-start gap-2">
                                  <span className="text-rose-400 mt-1">•</span>
                                  <span>{risk}</span>
                                </div>
                              ))}
                              {summary.parsed_summary.risk_factors.length > 3 && (
                                <div className="text-rose-600 text-xs font-medium mt-2">
                                  +{summary.parsed_summary.risk_factors.length - 3} more risks
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {summary.parsed_summary.opportunities?.length > 0 && (
                          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                            <h6 className="text-emerald-700 font-semibold mb-3 flex items-center gap-2">
                              <span>💡</span>
                              Opportunities
                            </h6>
                            <div className="space-y-2">
                              {summary.parsed_summary.opportunities.slice(0, 3).map((opportunity: string, idx: number) => (
                                <div key={idx} className="text-emerald-700 text-sm flex items-start gap-2">
                                  <span className="text-emerald-400 mt-1">•</span>
                                  <span>{opportunity}</span>
                                </div>
                              ))}
                              {summary.parsed_summary.opportunities.length > 3 && (
                                <div className="text-emerald-600 text-xs font-medium mt-2">
                                  +{summary.parsed_summary.opportunities.length - 3} more opportunities
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                  }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}