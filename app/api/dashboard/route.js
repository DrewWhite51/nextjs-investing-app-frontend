import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sentiment = searchParams.get('sentiment')
    const timeHorizon = searchParams.get('timeHorizon')
    const search = searchParams.get('search')
    
    // Build where clause for filtering
    const where = { AND: [] }
    
    if (sentiment) {
      where.AND.push({ sentiment })
    }
    
    if (timeHorizon) {
      where.AND.push({ time_horizon: timeHorizon })
    }
    
    if (search) {
      where.AND.push({
        OR: [
          { companies_mentioned: { contains: search } },
          { sectors_affected: { contains: search } },
          { summary: { contains: search } }
        ]
      })
    }
    
    // If no filters, remove AND array
    if (where.AND.length === 0) {
      delete where.AND
    }
    
    // Get summaries and stats in parallel
    const [summaries, stats] = await Promise.all([
      db.article_summaries.findMany({
        where,
        orderBy: { processed_at: 'desc' },
        take: 50
      }),
      
      db.$queryRaw`
        SELECT 
          COUNT(*) as total_summaries,
          COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive,
          COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative,
          COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,
          AVG(confidence_score) as avg_confidence
        FROM article_summaries
      `
    ])
    
    // Process summaries - parse JSON fields
    const processedSummaries = summaries.map(summary => ({
      id: summary.id,
      source_file: summary.source_file,
      processed_at: summary.processed_at,
      model_used: summary.model_used,
      parsed_summary: {
        summary: summary.summary,
        investment_implications: summary.investment_implications,
        sentiment: summary.sentiment,
        time_horizon: summary.time_horizon,
        confidence_score: summary.confidence_score,
        key_metrics: summary.key_metrics ? JSON.parse(summary.key_metrics) : [],
        companies_mentioned: summary.companies_mentioned ? JSON.parse(summary.companies_mentioned) : [],
        sectors_affected: summary.sectors_affected ? JSON.parse(summary.sectors_affected) : [],
        risk_factors: summary.risk_factors ? JSON.parse(summary.risk_factors) : [],
        opportunities: summary.opportunities ? JSON.parse(summary.opportunities) : []
      },
      processed_datetime: summary.processed_at ? new Date(summary.processed_at) : null
    }))
    
    // Format stats for template
    const dashboardStats = {
      total_summaries: Number(stats[0].total_summaries),
      sentiments: {
        positive: Number(stats[0].positive || 0),
        negative: Number(stats[0].negative || 0),
        neutral: Number(stats[0].neutral || 0)
      },
      avg_confidence: Math.round((stats[0].avg_confidence || 0) * 100) / 100
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