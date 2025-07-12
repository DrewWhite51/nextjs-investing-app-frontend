import { PrismaClient } from '../lib/generated/prisma'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Database utility functions
export const dbUtils = {
  // Test database connection
  async testConnection() {
    try {
      await db.$connect()
      console.log('✅ Database connected successfully')
      return true
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }
  },

  // Gracefully disconnect
  async disconnect() {
    await db.$disconnect()
  },

  // Get database info
  async getInfo() {
    try {
      // Updated for PostgreSQL
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
      // Use correct snake_case model names
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
    return db.article_summaries.findMany({
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
  },

  async getSummariesBySentiment(sentiment: string) {
    return db.article_summaries.findMany({
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
  },

  async getActiveSources() {
    return db.news_sources.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    })
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
    return db.article_summaries.findMany({
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
  },

  async getRecentCollectedUrls(limit: number = 50) {
    return db.collected_urls.findMany({
      take: limit,
      orderBy: { collected_at: 'desc' },
      include: {
        news_sources: true,
        collection_batches: true
      }
    })
  },

  async getCompletedBatches(limit: number = 20) {
    return db.collection_batches.findMany({
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
  }
}