import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sentiment = searchParams.get('sentiment')
    const timeHorizon = searchParams.get('timeHorizon')
    const search = searchParams.get('search')
    console.log('DATABASE_URL in production:', process.env.DATABASE_URL?.substring(0, 80) + '...')

    // Use Prisma ORM instead of raw queries
    const summaries = await db.article_summaries.findMany({
      take: 200,
      orderBy: { processed_at: 'desc' },
      include: {
        collected_urls: {
          select: {
            url: true,
            domain: true,
            collected_at: true
          }
        }
      }
    })

    // Get stats using aggregation
    const totalCount = await db.article_summaries.count()
    
    const sentimentCounts = await db.article_summaries.groupBy({
      by: ['sentiment'],
      _count: {
        sentiment: true
      }
    })

    const avgConfidence = await db.article_summaries.aggregate({
      _avg: {
        confidence_score: true
      }
    })

    // Process summaries
    let processedSummaries = summaries.map(summary => {
      try {
        return {
          id: Number(summary.id),
          source_file: summary.source_file || '',
          processed_at: summary.processed_at,
          model_used: summary.model_used || '',
          original_url: summary.collected_urls?.url || null,
          article_domain: summary.collected_urls?.domain || null,
          url_collected_at: summary.collected_urls?.collected_at || null,
          parsed_summary: {
            summary: summary.summary || '',
            investment_implications: summary.investment_implications || '',
            sentiment: summary.sentiment || '',
            time_horizon: summary.time_horizon || '',
            confidence_score: summary.confidence_score || 0,
            key_metrics: summary.key_metrics ? safeJsonParse(summary.key_metrics) : [],
            companies_mentioned: summary.companies_mentioned ? safeJsonParse(summary.companies_mentioned) : [],
            sectors_affected: summary.sectors_affected ? safeJsonParse(summary.sectors_affected) : [],
            risk_factors: summary.risk_factors ? safeJsonParse(summary.risk_factors) : [],
            opportunities: summary.opportunities ? safeJsonParse(summary.opportunities) : []
          },
          processed_datetime: summary.processed_at ? new Date(summary.processed_at) : null
        }
      } catch (parseError) {
        console.error('Error parsing summary:', parseError)
        return null
      }
    }).filter(Boolean)

    // Apply filters in JavaScript
    if (sentiment || timeHorizon || search) {
      processedSummaries = processedSummaries.filter(summary => {
        if (sentiment && summary.parsed_summary.sentiment?.toLowerCase() !== sentiment.toLowerCase()) {
          return false
        }
        
        if (timeHorizon && summary.parsed_summary.time_horizon?.toLowerCase() !== timeHorizon.toLowerCase()) {
          return false
        }
        
        if (search) {
          const searchTerm = search.toLowerCase()
          const searchableText = [
            summary.parsed_summary.summary,
            summary.parsed_summary.investment_implications,
            ...(summary.parsed_summary.companies_mentioned || []),
            ...(summary.parsed_summary.sectors_affected || []),
            ...(summary.parsed_summary.key_metrics || []),
            summary.source_file,
            summary.original_url || '',
            summary.article_domain || '',
            summary.model_used || ''
          ].join(' ').toLowerCase()
          
          if (!searchableText.includes(searchTerm)) {
            return false
          }
        }
        
        return true
      })
    }

    // Format stats from aggregation results
    const sentimentStats = {
      positive: sentimentCounts.find(s => s.sentiment === 'positive')?._count.sentiment || 0,
      negative: sentimentCounts.find(s => s.sentiment === 'negative')?._count.sentiment || 0,
      neutral: sentimentCounts.find(s => s.sentiment === 'neutral')?._count.sentiment || 0
    }

    const dashboardStats = {
      total_summaries: totalCount,
      sentiments: sentimentStats,
      avg_confidence: Math.round((avgConfidence._avg.confidence_score || 0) * 100) / 100
    }

    return NextResponse.json({
      success: true,
      data: {
        summaries: processedSummaries,
        stats: dashboardStats
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Helper function for safe JSON parsing
function safeJsonParse(jsonString) {
  try {
    const parsed = JSON.parse(jsonString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}