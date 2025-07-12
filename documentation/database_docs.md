# Next.js Database Integration Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Database Operations](#database-operations)
6. [API Reference](#api-reference)
7. [Migration & Management](#migration--management)
8. [Switching Databases](#switching-databases)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This database integration provides a flexible, type-safe way to connect your Next.js application to SQLite, PostgreSQL, or MySQL databases using Prisma ORM. The architecture is designed for easy database switching without code changes.

### Key Features
- **Multi-database support** (SQLite, PostgreSQL, MySQL)
- **Type-safe operations** with auto-generated TypeScript types
- **Migration system** for schema versioning
- **Service layer** for clean code organization
- **Environment-specific** configurations
- **Built-in utilities** for testing and seeding

---

## Architecture

```
Next.js App
├── Database Client (lib/db.js)
│   ├── Connection Management
│   ├── Utility Functions
│   └── Error Handling
├── Service Layer (lib/services/)
│   ├── Business Logic
│   ├── Data Validation
│   └── Error Response Handling
├── API Routes (app/api/)
│   ├── RESTful Endpoints
│   └── Request/Response Processing
└── Prisma Schema (prisma/schema.prisma)
    ├── Database Models
    ├── Relationships
    └── Database Provider Config
```

---

## Installation & Setup

### 1. Install Dependencies
```bash
# Core Prisma packages
npm install prisma @prisma/client

# SQLite support (default)
npm install sqlite3

# Optional: PostgreSQL support
npm install pg @types/pg

# Optional: MySQL support
npm install mysql2
```

### 2. Initialize Prisma
```bash
# Initialize with SQLite
npx prisma init --datasource-provider sqlite

# Generate client
npx prisma generate
```

### 3. Project Structure
```
your-nextjs-app/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration files
├── lib/
│   ├── db.js                  # Database client
│   └── services/              # Business logic
│       ├── userService.js
│       └── postService.js
├── app/api/
│   ├── users/
│   │   ├── route.js          # GET /api/users, POST /api/users
│   │   └── [id]/route.js     # GET/PUT/DELETE /api/users/:id
│   └── db/
│       └── status/route.js   # Database health check
├── scripts/
│   └── migrate.js            # Database management script
└── .env                      # Environment configuration
```

---

## Configuration

### Environment Variables

#### SQLite (Default)
```bash
# .env
DATABASE_URL="file:./dev.db"

# Connect to existing database
DATABASE_URL="file:/absolute/path/to/your/database.db"
DATABASE_URL="file:../relative/path/to/database.db"
```

#### PostgreSQL
```bash
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"

# Production example
DATABASE_URL="postgresql://user:pass@prod-host:5432/proddb?sslmode=require"
```

#### MySQL
```bash
# .env
DATABASE_URL="mysql://username:password@localhost:3306/dbname"
```

### Multiple Environments
```bash
# .env.development
DATABASE_URL="file:./dev.db"

# .env.production
DATABASE_URL="postgresql://user:pass@prod-host:5432/proddb"

# .env.test
DATABASE_URL="file:./test.db"
```

### Prisma Schema Configuration

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

// Choose one datasource
datasource db {
  provider = "sqlite"     // or "postgresql" or "mysql"
  url      = env("DATABASE_URL")
}

// Example models
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Database Operations

### Database Client (lib/db.js)

The main database client provides connection management and utilities:

```javascript
import { db, dbUtils } from '@/lib/db'

// Test connection
const isConnected = await dbUtils.testConnection()

// Get database info
const info = await dbUtils.getInfo()

// Reset database (development only)
await dbUtils.reset()

// Seed with sample data
await dbUtils.seed()

// Disconnect
await dbUtils.disconnect()
```

### Service Layer Usage

Services provide a clean interface for database operations:

```javascript
import { userService } from '@/lib/services/userService'

// Create user
const result = await userService.createUser({
  email: 'user@example.com',
  name: 'John Doe'
})

// Get all users
const users = await userService.getAllUsers()

// Get user by ID
const user = await userService.getUserById(1)

// Update user
const updated = await userService.updateUser(1, { name: 'Jane Doe' })

// Delete user
await userService.deleteUser(1)

// Search users
const results = await userService.searchUsers('john')
```

### Direct Prisma Usage

For complex queries, use Prisma client directly:

```javascript
import { db } from '@/lib/db'

// Complex query with relations
const usersWithPosts = await db.user.findMany({
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    }
  },
  where: {
    posts: {
      some: { published: true }
    }
  }
})

// Aggregation
const stats = await db.post.aggregate({
  _count: { id: true },
  _avg: { authorId: true },
  where: { published: true }
})

// Raw SQL (when needed)
const result = await db.$queryRaw`
  SELECT COUNT(*) as total FROM User 
  WHERE createdAt > ${new Date('2024-01-01')}
`
```

---

## API Reference

### REST Endpoints

#### Users API

**GET /api/users**
- Returns all users with their posts
- Response: `User[]`

**POST /api/users**
- Creates a new user
- Body: `{ email: string, name?: string }`
- Response: `User`

**GET /api/users/[id]**
- Returns user by ID with posts
- Response: `User | { error: string }`

**PUT /api/users/[id]**
- Updates user by ID
- Body: `{ email?: string, name?: string }`
- Response: `User`

**DELETE /api/users/[id]**
- Deletes user by ID
- Response: `{ message: string }`

#### Database Status API

**GET /api/db/status**
- Returns database connection status
- Response: `{ connected: boolean, info: object, timestamp: string }`

### API Usage Examples

```javascript
// Fetch all users
const response = await fetch('/api/users')
const users = await response.json()

// Create user
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe'
  })
})
const newUser = await response.json()

// Update user
const response = await fetch('/api/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Jane Doe' })
})

// Delete user
await fetch('/api/users/1', { method: 'DELETE' })

// Check database status
const status = await fetch('/api/db/status').then(r => r.json())
console.log(`Database connected: ${status.connected}`)
```

---

## Migration & Management

### Prisma Migration Commands

```bash
# Create and apply migration
npx prisma migrate dev --name description_of_changes

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate

# View database in browser
npx prisma studio

# Pull schema from existing database
npx prisma db pull

# Push schema changes without migration
npx prisma db push
```

### Custom Migration Script

Use the included migration script for common tasks:

```bash
# Check database status
node scripts/migrate.js status

# Add sample data
node scripts/migrate.js seed

# Clear all data (development only)
node scripts/migrate.js reset

# Reset and add sample data
node scripts/migrate.js resetAndSeed

# Show help
node scripts/migrate.js help
```

### Schema Changes Workflow

1. **Modify** `prisma/schema.prisma`
2. **Generate** migration: `npx prisma migrate dev --name your_change`
3. **Review** migration file in `prisma/migrations/`
4. **Test** changes locally
5. **Deploy** to production: `npx prisma migrate deploy`

---

## Switching Databases

### SQLite to PostgreSQL

1. **Install PostgreSQL driver:**
```bash
npm install pg @types/pg
```

2. **Update schema provider:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. **Update environment:**
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
```

4. **Create migration:**
```bash
npx prisma migrate dev --name switch_to_postgresql
```

### PostgreSQL to MySQL

1. **Install MySQL driver:**
```bash
npm install mysql2
```

2. **Update schema:**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

3. **Update environment:**
```bash
DATABASE_URL="mysql://user:pass@localhost:3306/mydb"
```

4. **Migrate:**
```bash
npx prisma migrate dev --name switch_to_mysql
```

### Database-Specific Considerations

| Feature | SQLite | PostgreSQL | MySQL |
|---------|--------|------------|-------|
| **File-based** | ✅ | ❌ | ❌ |
| **Concurrent writes** | Limited | ✅ | ✅ |
| **Full-text search** | Basic | Advanced | Good |
| **JSON support** | Basic | Native | Native |
| **Scaling** | Single machine | Horizontal | Horizontal |
| **Production ready** | Small apps | Enterprise | Enterprise |

---

## Best Practices

### Code Organization

```javascript
// ✅ Good: Use service layer
import { userService } from '@/lib/services/userService'
const result = await userService.createUser(userData)

// ❌ Avoid: Direct Prisma in components
import { db } from '@/lib/db'
const user = await db.user.create({ data: userData })
```

### Error Handling

```javascript
// ✅ Good: Consistent error responses
export async function createUser(userData) {
  try {
    const user = await db.user.create({ data: userData })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ✅ Good: API error handling
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 })
}
```

### Performance

```javascript
// ✅ Good: Include related data in one query
const users = await db.user.findMany({
  include: { posts: true }
})

// ❌ Avoid: N+1 queries
const users = await db.user.findMany()
for (const user of users) {
  user.posts = await db.post.findMany({ where: { authorId: user.id } })
}

// ✅ Good: Use pagination for large datasets
const users = await db.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize
})
```

### Security

```javascript
// ✅ Good: Validate input
const result = await userService.createUser({
  email: email.toLowerCase().trim(),
  name: name?.trim()
})

// ✅ Good: Use parameterized queries (Prisma handles this)
const users = await db.user.findMany({
  where: { email: userEmail }  // Safe from SQL injection
})

// ❌ Avoid: Raw SQL with user input (unless properly sanitized)
await db.$queryRaw`SELECT * FROM User WHERE email = ${email}`
```

### Environment Management

```javascript
// ✅ Good: Environment-specific settings
if (process.env.NODE_ENV === 'production') {
  // Production-only code
}

// ✅ Good: Fail fast on missing config
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}
```

---

## Troubleshooting

### Common Issues

#### Connection Issues

**Problem**: Database connection fails
```bash
Error: P1001: Can't reach database server
```

**Solutions**:
1. Check `DATABASE_URL` format
2. Verify database server is running
3. Check network connectivity
4. Validate credentials

#### Migration Issues

**Problem**: Migration fails
```bash
Error: P3018: A migration failed to apply
```

**Solutions**:
1. Check database permissions
2. Review migration SQL
3. Manually fix database state
4. Use `prisma migrate resolve` if needed

#### Schema Sync Issues

**Problem**: Schema out of sync
```bash
Error: Prisma schema and database are out of sync
```

**Solutions**:
```bash
# Pull current database state
npx prisma db pull

# Or push schema changes
npx prisma db push

# Or create migration
npx prisma migrate dev
```

### Debugging Tools

#### Enable Query Logging
```javascript
// lib/db.js
export const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

#### Database Inspection
```bash
# Open Prisma Studio
npx prisma studio

# Check migration status
npx prisma migrate status

# Validate schema
npx prisma validate
```

#### Connection Testing
```javascript
// Test database connection
import { dbUtils } from '@/lib/db'

async function testConnection() {
  const connected = await dbUtils.testConnection()
  console.log(`Database connected: ${connected}`)
  
  const info = await dbUtils.getInfo()
  console.log('Database info:', info)
}
```

### Performance Debugging

#### Slow Queries
```javascript
// Enable query timing
const start = Date.now()
const result = await db.user.findMany()
console.log(`Query took ${Date.now() - start}ms`)

// Use explain for complex queries
const explain = await db.$queryRaw`EXPLAIN QUERY PLAN 
  SELECT * FROM User WHERE email LIKE '%@example.com'`
```

#### Memory Usage
```javascript
// Monitor Prisma client memory
process.on('exit', async () => {
  await db.$disconnect()
  console.log('Database disconnected')
})
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations deployed
- [ ] Connection pooling enabled
- [ ] Query logging disabled (or minimal)
- [ ] Error monitoring in place
- [ ] Database backups configured
- [ ] SSL/TLS enabled for remote databases
- [ ] Resource limits set appropriately

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

*This documentation covers the complete database integration system. For specific issues not covered here, check the troubleshooting section or refer to the official Prisma and Next.js documentation.*