import { PrismaClient } from './generated/prisma'  // Note: relative path from lib/db.ts


// Global type declaration for Prisma
declare global {
  var __prisma: PrismaClient | undefined
}

// Create a single instance with production-optimized configuration
export const db = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  
  // Production optimization for serverless
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  
  // Connection management for serverless
  // __internal configuration removed because it's not supported in PrismaClient options
})

// Only cache in development to prevent memory leaks
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}

// Graceful cleanup
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}

// Database utility functions
export const dbUtils = {
  // Test database connection
  async testConnection() {
    try {
      await db.$queryRaw`SELECT 1`
      console.log('✅ Database connected successfully')
      return true
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }
  },

  // Gracefully disconnect
  async disconnect() {
    try {
      await db.$disconnect()
    } catch (error) {
      console.error('Error disconnecting from database:', error)
    }
  },

  // Get database info
  async getInfo() {
    try {
      const result = await db.$queryRaw`SELECT version() as version`
      return (result as Array<{ version: string }>)[0]
    } catch (error) {
      console.error('Could not get database info:', error)
      return null
    }
  },

  // Reset database (useful for development)
  async reset() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production')
    }
    try {
      // Delete in correct order due to foreign key constraints
      await db.article_summaries.deleteMany()
      await db.collected_urls.deleteMany()
      await db.collection_batches.deleteMany()
      await db.pipeline_runs.deleteMany()
      await db.news_sources.deleteMany()
      console.log('🗑️ Database reset successfully')
    } catch (error) {
      console.error('Failed to reset database:', error)
      throw error
    }
  },

  // Seed database with sample data
  async seed() {
    try {
      // Create sample news source
      const newsSource = await db.news_sources.create({
        data: {
          name: 'Sample News Source',
          url: 'https://example.com',
          category: 'Technology',
          description: 'Sample news source for testing',
          active: true
        }
      })

      // Create sample collection batch
      const batch = await db.collection_batches.create({
        data: {
          batch_id: 'sample-batch-' + Date.now(),
          sources_count: 1,
          completed: true
        }
      })

      // Create sample collected URL
      const collectedUrl = await db.collected_urls.create({
        data: {
          source_id: newsSource.id,
          url: 'https://example.com/article-1',
          domain: 'example.com',
          collection_batch_id: batch.batch_id
        }
      })

      console.log('🌱 Database seeded successfully')
      return { newsSource, batch, collectedUrl }
    } catch (error) {
      console.error('Failed to seed database:', error)
      throw error
    }
  },

  // Additional utility functions for your investment app
  async getLatestSummaries(limit: number = 10) {
    try {
      return await db.article_summaries.findMany({
        take: limit,
        orderBy: { processed_at: 'desc' },
        include: {
          collected_urls: {
            include: {
              news_sources: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching latest summaries:', error)
      throw error
    }
  },

  async getSummariesBySentiment(sentiment: string) {
    try {
      return await db.article_summaries.findMany({
        where: { sentiment },
        orderBy: { processed_at: 'desc' },
        include: {
          collected_urls: {
            include: {
              news_sources: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching summaries by sentiment:', error)
      throw error
    }
  },

  async getActiveSources() {
    try {
      return await db.news_sources.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching active sources:', error)
      throw error
    }
  },

  // Helper function to safely convert BigInt to number
  bigIntToNumber(value: bigint | null | undefined): number | null {
    if (value === null || value === undefined) return null
    return Number(value)
  },

  // Helper function to safely convert number to BigInt for queries
  numberToBigInt(value: number | null | undefined): bigint | null {
    if (value === null || value === undefined) return null
    return BigInt(value)
  },

  // Additional useful queries for your investment app
  async getSummariesByConfidenceScore(minScore: number = 0.7) {
    try {
      return await db.article_summaries.findMany({
        where: {
          confidence_score: {
            gte: minScore
          }
        },
        orderBy: { confidence_score: 'desc' },
        include: {
          collected_urls: {
            include: {
              news_sources: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching summaries by confidence score:', error)
      throw error
    }
  },

  async getRecentCollectedUrls(limit: number = 50) {
    try {
      return await db.collected_urls.findMany({
        take: limit,
        orderBy: { collected_at: 'desc' },
        include: {
          news_sources: true,
          collection_batches: true
        }
      })
    } catch (error) {
      console.error('Error fetching recent collected URLs:', error)
      throw error
    }
  },

  async getCompletedBatches(limit: number = 20) {
    try {
      return await db.collection_batches.findMany({
        where: { completed: true },
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          collected_urls: {
            include: {
              news_sources: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching completed batches:', error)
      throw error
    }
  }
}