// app/api/summaries/[id]/route.js
// Single summary details (for the "View Details" link)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id)
    
    const summary = await db.article_summaries.findUnique({
      where: { id },
      include: {
        collected_urls: {
          select: { url: true, domain: true }
        },
        pipeline_runs: {
          select: { run_id: true, model_used: true, started_at: true }
        }
      }
    })
    
    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Summary not found' },
        { status: 404 }
      )
    }
    
    // Process the summary with parsed JSON fields
    const processedSummary = {
      id: summary.id,
      source_file: summary.source_file,
      processed_at: summary.processed_at,
      model_used: summary.model_used,
      raw_response: summary.raw_response,
      source_url: summary.source_url,
      collected_urls: summary.collected_urls,
      pipeline_runs: summary.pipeline_runs,
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
    }
    
    return NextResponse.json({
      success: true,
      data: processedSummary
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}