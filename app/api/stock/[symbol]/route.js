// app/api/stock/[symbol]/route.js
import yahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  // Await params in Next.js 15+
  const { symbol } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '1mo';
  const interval = searchParams.get('interval') || '1d';

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching data for ${symbol} with period ${period}`);
    
    // Calculate date range for the period
    const getPeriodDates = (period) => {
      const now = new Date();
      const periods = {
        '1d': new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        '5d': new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        '1mo': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '3mo': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        '6mo': new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        '2y': new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000),
      };
      return periods[period] || periods['1mo'];
    };

    // Get multiple data points in parallel
    const [quote, historical, companyInfo] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.historical(symbol, {
        period1: getPeriodDates(period),
        period2: new Date(),
        interval: interval,
      }),
      yahooFinance.quoteSummary(symbol, {
        modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics']
      }).catch(() => null) // Handle if company info fails
    ]);

    // Format historical data for charts
    const chartData = historical.map(item => ({
      date: item.date.toISOString().split('T')[0],
      timestamp: item.date.getTime(),
      open: parseFloat(item.open?.toFixed(2) || 0),
      high: parseFloat(item.high?.toFixed(2) || 0),
      low: parseFloat(item.low?.toFixed(2) || 0),
      close: parseFloat(item.close?.toFixed(2) || 0),
      volume: item.volume || 0,
    }));

    // Extract key quote information
    const stockData = {
      symbol: quote.symbol,
      shortName: quote.shortName || quote.displayName || symbol,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      currency: quote.currency || 'USD',
      marketState: quote.marketState,
      regularMarketVolume: quote.regularMarketVolume,
      averageVolume: quote.averageVolume,
      marketCap: quote.marketCap,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      trailingPE: quote.trailingPE,
      dividendYield: quote.dividendYield,
    };

    return NextResponse.json({
      stock: stockData,
      chartData: chartData,
      companyInfo: companyInfo,
      period: period,
      interval: interval
    });

  } catch (error) {
    console.error('Error fetching stock data:', error);
    
    // Handle different types of errors
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return NextResponse.json(
        { 
          error: `Stock symbol "${symbol}" not found`,
          symbol: symbol 
        },
        { status: 404 }
      );
    }
    
    if (error.message.includes('rate limit') || error.message.includes('throttle')) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          symbol: symbol 
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch stock data. Please try again.',
        details: error.message,
        symbol: symbol 
      },
      { status: 500 }
    );
  }
}