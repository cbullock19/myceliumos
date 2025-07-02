import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create DATABASE_URL with connection pool settings for serverless
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  // For production/serverless environments, add connection pool parameters
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(baseUrl)
    
    // Add connection pool parameters for serverless environments
    url.searchParams.set('connection_limit', '1')        // Limit connections per instance
    url.searchParams.set('pool_timeout', '20')           // Connection timeout in seconds
    url.searchParams.set('connect_timeout', '10')        // Initial connection timeout
    url.searchParams.set('statement_timeout', '30000')   // Statement timeout in ms
    url.searchParams.set('idle_timeout', '300')          // Idle connection timeout
    
    return url.toString()
  }
  
  return baseUrl
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  // Log configuration - minimal in production
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Connection management for serverless environments
if (process.env.NODE_ENV === 'production') {
  // Gracefully handle connection cleanup
  process.on('beforeExit', async () => {
    console.log('🔄 Cleaning up Prisma connections...')
    await prisma.$disconnect()
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 