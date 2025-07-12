#!/usr/bin/env node

// scripts/migrate.js
// Run with: node scripts/migrate.js [command]

import { db, dbUtils } from '../lib/db.js'

const commands = {
  async status() {
    console.log('🔍 Checking database status...')
    const connected = await dbUtils.testConnection()
    const info = await dbUtils.getInfo()
    
    console.log(`Connection: ${connected ? '✅ Connected' : '❌ Failed'}`)
    if (info) {
      console.log(`Database info:`, info)
    }
  },

  async seed() {
    console.log('🌱 Seeding database...')
    await dbUtils.seed()
  },

  async reset() {
    console.log('🗑️ Resetting database...')
    await dbUtils.reset()
  },

  async resetAndSeed() {
    console.log('🔄 Resetting and seeding database...')
    await dbUtils.reset()
    await dbUtils.seed()
  },

  help() {
    console.log(`
📚 Database Migration Commands:

  status       - Check database connection and info
  seed         - Add sample data to database  
  reset        - Clear all data (dev only)
  resetAndSeed - Reset and add sample data
  help         - Show this help message

Usage: node scripts/migrate.js [command]
`)
  }
}

async function main() {
  const command = process.argv[2] || 'help'
  
  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`)
    commands.help()
    process.exit(1)
  }

  try {
    await commands[command]()
    console.log('✅ Operation completed successfully')
  } catch (error) {
    console.error('❌ Operation failed:', error.message)
    process.exit(1)
  } finally {
    await dbUtils.disconnect()
  }
}

main()