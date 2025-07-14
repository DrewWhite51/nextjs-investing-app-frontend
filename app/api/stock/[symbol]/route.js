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
    console.log(`Fetching comprehensive data for ${symbol} with period ${period}`);

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

    // Helper function to safely extract values
    const safeExtract = (obj, fallback = null) => {
      if (obj === null || obj === undefined) return fallback;
      if (typeof obj === 'object' && obj.raw !== undefined) return obj.raw;
      return obj;
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
        modules: [
          'summaryProfile',
          'financialData',
          'defaultKeyStatistics',
          'summaryDetail',
          'calendarEvents',
          'recommendationTrend',
          'upgradeDowngradeHistory',
          'earnings',
          'earningsHistory',
          'earningsTrend',
          'incomeStatementHistory',
          'incomeStatementHistoryQuarterly',
          'cashflowStatementHistory',
          'cashflowStatementHistoryQuarterly',
          'balanceSheetHistory',
          'balanceSheetHistoryQuarterly',
          'majorHoldersBreakdown',
          'fundOwnership',
          'insiderTransactions',
          'price',
          'quoteType'
        ]
      }).catch((err) => {
        console.warn('Some quote summary modules failed:', err.message);
        return null;
      })
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
      longName: quote.longName,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      currency: quote.currency || 'USD',
      marketState: quote.marketState,
      exchangeName: quote.fullExchangeName,
      regularMarketVolume: quote.regularMarketVolume,
      averageVolume: quote.averageVolume,
      averageVolume10days: quote.averageVolume10days,
      marketCap: quote.marketCap,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyDayAverage: quote.fiftyDayAverage,
      twoHundredDayAverage: quote.twoHundredDayAverage,
      trailingPE: quote.trailingPE,
      forwardPE: quote.forwardPE,
      priceToBook: quote.priceToBook,
      dividendYield: quote.dividendYield,
      dividendRate: quote.dividendRate,
      exDividendDate: quote.exDividendDate,
      payoutRatio: quote.payoutRatio,
      beta: quote.beta,
      earningsPerShare: quote.epsTrailingTwelveMonths,
      bookValue: quote.bookValue,
      priceToSales: quote.priceToSales,
      enterpriseValue: quote.enterpriseValue,
      enterpriseToRevenue: quote.enterpriseToRevenue,
      enterpriseToEbitda: quote.enterpriseToEbitda,
    };

    // Process and structure the comprehensive company info
    const processedCompanyInfo = companyInfo ? {
      // Summary Profile (Company Info) - no .raw needed here
      summaryProfile: companyInfo.summaryProfile ? {
        address1: companyInfo.summaryProfile.address1,
        address2: companyInfo.summaryProfile.address2,
        city: companyInfo.summaryProfile.city,
        state: companyInfo.summaryProfile.state,
        zip: companyInfo.summaryProfile.zip,
        country: companyInfo.summaryProfile.country,
        phone: companyInfo.summaryProfile.phone,
        website: companyInfo.summaryProfile.website,
        industry: companyInfo.summaryProfile.industry,
        sector: companyInfo.summaryProfile.sector,
        longBusinessSummary: companyInfo.summaryProfile.longBusinessSummary,
        fullTimeEmployees: companyInfo.summaryProfile.fullTimeEmployees,
        companyOfficers: companyInfo.summaryProfile.companyOfficers,
        irWebsite: companyInfo.summaryProfile.irWebsite,
        maxAge: companyInfo.summaryProfile.maxAge
      } : null,

      // Financial Data - mix of direct values and .raw values
      financialData: companyInfo.financialData ? {
        // Direct values from the response
        totalCash: companyInfo.financialData.totalCash,
        totalCashPerShare: companyInfo.financialData.totalCashPerShare,
        totalDebt: companyInfo.financialData.totalDebt,
        totalRevenue: companyInfo.financialData.totalRevenue,
        grossProfit: companyInfo.financialData.grossProfits, // Note: it's grossProfits not grossProfit
        operatingIncome: null, // Not directly available in this response
        netIncome: null, // Not directly available in this response
        freeCashFlow: companyInfo.financialData.freeCashflow, // Note: lowercase 'f'
        operatingCashFlow: companyInfo.financialData.operatingCashflow, // Note: lowercase 'f'
        returnOnEquity: companyInfo.financialData.returnOnEquity,
        returnOnAssets: companyInfo.financialData.returnOnAssets,
        profitMargins: companyInfo.financialData.profitMargins,
        operatingMargins: companyInfo.financialData.operatingMargins,
        grossMargins: companyInfo.financialData.grossMargins,
        currentRatio: companyInfo.financialData.currentRatio,
        quickRatio: companyInfo.financialData.quickRatio,
        debtToEquity: companyInfo.financialData.debtToEquity,
        priceToBook: null, // Use from quote data instead
        priceToSales: null, // Use from quote data instead
        earningsGrowth: companyInfo.financialData.earningsGrowth,
        revenueGrowth: companyInfo.financialData.revenueGrowth,
        recommendationMean: companyInfo.financialData.recommendationMean,
        recommendationKey: companyInfo.financialData.recommendationKey,
        targetMeanPrice: companyInfo.financialData.targetMeanPrice,
        targetHighPrice: companyInfo.financialData.targetHighPrice,
        targetLowPrice: companyInfo.financialData.targetLowPrice,
        numberOfAnalystOpinions: companyInfo.financialData.numberOfAnalystOpinions,
        ebitda: companyInfo.financialData.ebitda,
        ebitdaMargins: companyInfo.financialData.ebitdaMargins
      } : null,

      // Key Statistics - many have .raw values, some don't
      defaultKeyStatistics: companyInfo.defaultKeyStatistics ? {
        beta: companyInfo.defaultKeyStatistics.beta,
        trailingEps: safeExtract(companyInfo.defaultKeyStatistics.trailingEps),
        forwardEps: safeExtract(companyInfo.defaultKeyStatistics.forwardEps),
        pegRatio: safeExtract(companyInfo.defaultKeyStatistics.pegRatio),
        bookValue: companyInfo.defaultKeyStatistics.bookValue,
        priceToBook: companyInfo.defaultKeyStatistics.priceToBook,
        earningsQuarterlyGrowth: companyInfo.defaultKeyStatistics.earningsQuarterlyGrowth,
        netIncomeToCommon: safeExtract(companyInfo.defaultKeyStatistics.netIncomeToCommon),
        trailingPE: companyInfo.defaultKeyStatistics.trailingPE,
        forwardPE: companyInfo.defaultKeyStatistics.forwardPE,
        enterpriseValue: safeExtract(companyInfo.defaultKeyStatistics.enterpriseValue),
        enterpriseToRevenue: safeExtract(companyInfo.defaultKeyStatistics.enterpriseToRevenue),
        enterpriseToEbitda: safeExtract(companyInfo.defaultKeyStatistics.enterpriseToEbitda),
        sharesOutstanding: safeExtract(companyInfo.defaultKeyStatistics.sharesOutstanding),
        floatShares: safeExtract(companyInfo.defaultKeyStatistics.floatShares),
        sharesShort: safeExtract(companyInfo.defaultKeyStatistics.sharesShort),
        sharesShortPriorMonth: safeExtract(companyInfo.defaultKeyStatistics.sharesShortPriorMonth),
        shortRatio: companyInfo.defaultKeyStatistics.shortRatio,
        shortPercentOfFloat: companyInfo.defaultKeyStatistics.shortPercentOfFloat,
        heldPercentInsiders: companyInfo.defaultKeyStatistics.heldPercentInsiders,
        heldPercentInstitutions: companyInfo.defaultKeyStatistics.heldPercentInstitutions,
        lastDividendValue: safeExtract(companyInfo.defaultKeyStatistics.lastDividendValue),
        lastDividendDate: safeExtract(companyInfo.defaultKeyStatistics.lastDividendDate)
      } : null,

      // Summary Detail - direct values
      summaryDetail: companyInfo.summaryDetail ? {
        dividendRate: companyInfo.summaryDetail.dividendRate,
        dividendYield: companyInfo.summaryDetail.dividendYield,
        payoutRatio: companyInfo.summaryDetail.payoutRatio,
        beta: companyInfo.summaryDetail.beta,
        trailingPE: companyInfo.summaryDetail.trailingPE,
        forwardPE: companyInfo.summaryDetail.forwardPE,
        priceToSalesTrailing12Months: companyInfo.summaryDetail.priceToSalesTrailing12Months,
        fiftyDayAverage: companyInfo.summaryDetail.fiftyDayAverage,
        twoHundredDayAverage: companyInfo.summaryDetail.twoHundredDayAverage,
        averageVolume: companyInfo.summaryDetail.averageVolume,
        averageVolume10days: companyInfo.summaryDetail.averageVolume10days
      } : null,

      // Earnings Information
      earnings: companyInfo.earnings ? {
        maxAge: companyInfo.earnings.maxAge,
        earningsChart: companyInfo.earnings.earningsChart,
        financialsChart: companyInfo.earnings.financialsChart,
        financialCurrency: companyInfo.earnings.financialCurrency
      } : null,

      // Earnings History
      earningsHistory: companyInfo.earningsHistory ? {
        history: companyInfo.earningsHistory.history?.map(item => ({
          maxAge: item.maxAge,
          epsActual: safeExtract(item.epsActual),
          epsEstimate: safeExtract(item.epsEstimate),
          epsDifference: safeExtract(item.epsDifference),
          surprisePercent: safeExtract(item.surprisePercent),
          quarter: safeExtract(item.quarter),
          period: item.period
        }))
      } : null,

      // Earnings Trend
      earningsTrend: companyInfo.earningsTrend ? {
        trend: companyInfo.earningsTrend.trend?.map(item => ({
          maxAge: item.maxAge,
          period: item.period,
          endDate: item.endDate,
          growth: safeExtract(item.growth),
          earningsEstimate: item.earningsEstimate ? {
            avg: safeExtract(item.earningsEstimate.avg),
            low: safeExtract(item.earningsEstimate.low),
            high: safeExtract(item.earningsEstimate.high),
            yearAgoEps: safeExtract(item.earningsEstimate.yearAgoEps),
            numberOfAnalysts: safeExtract(item.earningsEstimate.numberOfAnalysts),
            growth: safeExtract(item.earningsEstimate.growth)
          } : null,
          revenueEstimate: item.revenueEstimate ? {
            avg: safeExtract(item.revenueEstimate.avg),
            low: safeExtract(item.revenueEstimate.low),
            high: safeExtract(item.revenueEstimate.high),
            numberOfAnalysts: safeExtract(item.revenueEstimate.numberOfAnalysts),
            yearAgoRevenue: safeExtract(item.revenueEstimate.yearAgoRevenue),
            growth: safeExtract(item.revenueEstimate.growth)
          } : null
        }))
      } : null,

      // Major Holders Breakdown - direct values
      majorHoldersBreakdown: companyInfo.majorHoldersBreakdown ? {
        maxAge: companyInfo.majorHoldersBreakdown.maxAge,
        insidersPercentHeld: companyInfo.majorHoldersBreakdown.insidersPercentHeld,
        institutionsPercentHeld: companyInfo.majorHoldersBreakdown.institutionsPercentHeld,
        institutionsFloatPercentHeld: companyInfo.majorHoldersBreakdown.institutionsFloatPercentHeld,
        institutionsCount: companyInfo.majorHoldersBreakdown.institutionsCount
      } : null,

      // Recommendation Trend
      recommendationTrend: companyInfo.recommendationTrend ? {
        trend: companyInfo.recommendationTrend.trend?.map(item => ({
          period: item.period,
          strongBuy: safeExtract(item.strongBuy, 0),
          buy: safeExtract(item.buy, 0),
          hold: safeExtract(item.hold, 0),
          sell: safeExtract(item.sell, 0),
          strongSell: safeExtract(item.strongSell, 0)
        }))
      } : null,

      // Income Statement History
      incomeStatementHistory: companyInfo.incomeStatementHistory ? {
        incomeStatementHistory: companyInfo.incomeStatementHistory.incomeStatementHistory?.map(item => ({
          maxAge: item.maxAge,
          endDate: safeExtract(item.endDate),
          totalRevenue: safeExtract(item.totalRevenue),
          costOfRevenue: safeExtract(item.costOfRevenue),
          grossProfit: safeExtract(item.grossProfit),
          researchDevelopment: safeExtract(item.researchDevelopment),
          sellingGeneralAdministrative: safeExtract(item.sellingGeneralAdministrative),
          nonRecurring: safeExtract(item.nonRecurring),
          otherOperatingExpenses: safeExtract(item.otherOperatingExpenses),
          totalOperatingExpenses: safeExtract(item.totalOperatingExpenses),
          operatingIncome: safeExtract(item.operatingIncome),
          totalOtherIncomeExpenseNet: safeExtract(item.totalOtherIncomeExpenseNet),
          ebit: safeExtract(item.ebit),
          interestExpense: safeExtract(item.interestExpense),
          incomeBeforeTax: safeExtract(item.incomeBeforeTax),
          incomeTaxExpense: safeExtract(item.incomeTaxExpense),
          minorityInterest: safeExtract(item.minorityInterest),
          netIncomeFromContinuingOps: safeExtract(item.netIncomeFromContinuingOps),
          discontinuedOperations: safeExtract(item.discontinuedOperations),
          extraordinaryItems: safeExtract(item.extraordinaryItems),
          effectOfAccountingCharges: safeExtract(item.effectOfAccountingCharges),
          otherItems: safeExtract(item.otherItems),
          netIncome: safeExtract(item.netIncome),
          netIncomeApplicableToCommonShares: safeExtract(item.netIncomeApplicableToCommonShares)
        }))
      } : null,

      // Balance Sheet History
      balanceSheetHistory: companyInfo.balanceSheetHistory ? {
        balanceSheetStatements: companyInfo.balanceSheetHistory.balanceSheetStatements?.map(item => ({
          maxAge: item.maxAge,
          endDate: safeExtract(item.endDate),
          cash: safeExtract(item.cash),
          shortTermInvestments: safeExtract(item.shortTermInvestments),
          netReceivables: safeExtract(item.netReceivables),
          inventory: safeExtract(item.inventory),
          otherCurrentAssets: safeExtract(item.otherCurrentAssets),
          totalCurrentAssets: safeExtract(item.totalCurrentAssets),
          longTermInvestments: safeExtract(item.longTermInvestments),
          propertyPlantEquipment: safeExtract(item.propertyPlantEquipment),
          goodWill: safeExtract(item.goodWill),
          intangibleAssets: safeExtract(item.intangibleAssets),
          accumulatedAmortization: safeExtract(item.accumulatedAmortization),
          otherAssets: safeExtract(item.otherAssets),
          deferredLongTermAssetCharges: safeExtract(item.deferredLongTermAssetCharges),
          totalAssets: safeExtract(item.totalAssets),
          accountsPayable: safeExtract(item.accountsPayable),
          shortLongTermDebt: safeExtract(item.shortLongTermDebt),
          otherCurrentLiab: safeExtract(item.otherCurrentLiab),
          longTermDebt: safeExtract(item.longTermDebt),
          otherLiab: safeExtract(item.otherLiab),
          deferredLongTermLiab: safeExtract(item.deferredLongTermLiab),
          minorityInterest: safeExtract(item.minorityInterest),
          negativeGoodwill: safeExtract(item.negativeGoodwill),
          totalCurrentLiabilities: safeExtract(item.totalCurrentLiabilities),
          totalLiab: safeExtract(item.totalLiab),
          commonStock: safeExtract(item.commonStock),
          retainedEarnings: safeExtract(item.retainedEarnings),
          treasuryStock: safeExtract(item.treasuryStock),
          capitalSurplus: safeExtract(item.capitalSurplus),
          otherStockholderEquity: safeExtract(item.otherStockholderEquity),
          totalStockholderEquity: safeExtract(item.totalStockholderEquity),
          netTangibleAssets: safeExtract(item.netTangibleAssets)
        }))
      } : null,

      // Cash Flow Statement History
      cashflowStatementHistory: companyInfo.cashflowStatementHistory ? {
        cashflowStatements: companyInfo.cashflowStatementHistory.cashflowStatements?.map(item => ({
          maxAge: item.maxAge,
          endDate: safeExtract(item.endDate),
          netIncome: safeExtract(item.netIncome),
          depreciation: safeExtract(item.depreciation),
          changeToNetincome: safeExtract(item.changeToNetincome),
          changeToAccountReceivables: safeExtract(item.changeToAccountReceivables),
          changeToLiabilities: safeExtract(item.changeToLiabilities),
          changeToInventory: safeExtract(item.changeToInventory),
          changeToOperatingActivities: safeExtract(item.changeToOperatingActivities),
          totalCashFromOperatingActivities: safeExtract(item.totalCashFromOperatingActivities),
          capitalExpenditures: safeExtract(item.capitalExpenditures),
          investments: safeExtract(item.investments),
          otherCashflowsFromInvestingActivities: safeExtract(item.otherCashflowsFromInvestingActivities),
          totalCashflowsFromInvestingActivities: safeExtract(item.totalCashflowsFromInvestingActivities),
          dividendsPaid: safeExtract(item.dividendsPaid),
          salePurchaseOfStock: safeExtract(item.salePurchaseOfStock),
          netBorrowings: safeExtract(item.netBorrowings),
          otherCashflowsFromFinancingActivities: safeExtract(item.otherCashflowsFromFinancingActivities),
          totalCashFromFinancingActivities: safeExtract(item.totalCashFromFinancingActivities),
          changeInCash: safeExtract(item.changeInCash),
          repurchaseOfStock: safeExtract(item.repurchaseOfStock),
          issuanceOfStock: safeExtract(item.issuanceOfStock)
        }))
      } : null
    } : null;

    return NextResponse.json({
      stock: stockData,
      chartData: chartData,
      companyInfo: processedCompanyInfo,
      period: period,
      interval: interval,
      timestamp: new Date().toISOString()
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