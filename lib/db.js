import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis

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
      const result = await db.$queryRaw`SELECT sqlite_version() as version`
      return result[0]
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
      await db.post.deleteMany()
      await db.user.deleteMany()
      console.log('🗑️ Database reset successfully')
    } catch (error) {
      console.error('Failed to reset database:', error)
      throw error
    }
  },

  // Seed database with sample data
  async seed() {
    try {
      const user = await db.user.create({
        data: {
          email: 'john@example.com',
          name: 'John Doe',
          posts: {
            create: [
              {
                title: 'My First Post',
                content: 'This is my first post content',
                published: true
              },
              {
                title: 'Draft Post',
                content: 'This is a draft post',
                published: false
              }
            ]
          }
        }
      })
      
      console.log('🌱 Database seeded successfully')
      return user
    } catch (error) {
      console.error('Failed to seed database:', error)
      throw error
    }
  }
}