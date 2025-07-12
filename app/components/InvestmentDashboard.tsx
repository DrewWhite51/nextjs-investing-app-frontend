'use client'
import React, { useState, useEffect, useMemo } from 'react'
import NewsCard from './NewsCard' // Adjust the import path as needed

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
  original_url?: string
  article_domain?: string
  url_collected_at?: string
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

export default function InvestmentDashboard(): React.JSX.Element {
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

        {/* Results Count and Top Pagination */}
        {filteredSummaries.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="text-slate-600">
                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredSummaries.length)} of {filteredSummaries.length} results
              </div>
              <div className="text-slate-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
            
            {/* Top Pagination */}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-6 mb-8">
              {paginatedSummaries.map((summary) => (
                <NewsCard key={summary.id} summary={summary} />
              ))}
            </div>

            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
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

            {/* Results Summary at Bottom */}
            {filteredSummaries.length > 0 && (
              <div className="flex justify-center items-center mt-4 text-slate-600 text-sm">
                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredSummaries.length)} of {filteredSummaries.length} results
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}