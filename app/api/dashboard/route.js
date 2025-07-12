import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sentiment = searchParams.get('sentiment')
    const timeHorizon = searchParams.get('timeHorizon')
    const search = searchParams.get('search')

    // Get summaries with JOIN to collected_urls
    const summaries = await db.$queryRaw`
      SELECT 
        a.*,
        cu.url as original_url,
        cu.domain as article_domain,
        cu.collected_at as url_collected_at
      FROM article_summaries as a
      LEFT JOIN collected_urls as cu ON cu.id = a.url_id
      ORDER BY a.processed_at DESC
      LIMIT 200
    `

    // Get stats from article_summaries
    const stats = await db.$queryRaw`
      SELECT
        COUNT(*) as total_summaries,
        COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative,
        COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,
        AVG(confidence_score) as avg_confidence
      FROM article_summaries
    `

    // Process summaries and handle potential JSON parsing errors
    let processedSummaries = summaries.map(summary => {
      try {
        return {
          id: Number(summary.id),
          source_file: summary.source_file || '',
          processed_at: summary.processed_at,
          model_used: summary.model_used || '',
          original_url: summary.original_url || null,
          article_domain: summary.article_domain || null,
          url_collected_at: summary.url_collected_at || null,
          parsed_summary: {
            summary: summary.summary || '',
            investment_implications: summary.investment_implications || '',
            sentiment: summary.sentiment || '',
            time_horizon: summary.time_horizon || '',
            confidence_score: summary.confidence_score || 0,
            key_metrics: summary.key_metrics ? JSON.parse(summary.key_metrics) : [],
            companies_mentioned: summary.companies_mentioned ? JSON.parse(summary.companies_mentioned) : [],
            sectors_affected: summary.sectors_affected ? JSON.parse(summary.sectors_affected) : [],
            risk_factors: summary.risk_factors ? JSON.parse(summary.risk_factors) : [],
            opportunities: summary.opportunities ? JSON.parse(summary.opportunities) : []
          },
          processed_datetime: summary.processed_at ? new Date(summary.processed_at) : null
        }
      } catch (parseError) {
        console.error('Error parsing summary:', parseError, summary)
        return null
      }
    }).filter(Boolean) // Remove any null entries from parsing errors

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

    // Format stats
    const dashboardStats = {
      total_summaries: Number(stats[0]?.total_summaries || 0),
      sentiments: {
        positive: Number(stats[0]?.positive || 0),
        negative: Number(stats[0]?.negative || 0),
        neutral: Number(stats[0]?.neutral || 0)
      },
      avg_confidence: Math.round((Number(stats[0]?.avg_confidence) || 0) * 100) / 100
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
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}