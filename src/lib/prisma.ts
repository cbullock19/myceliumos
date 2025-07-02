import { PrismaClient, Prisma } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client configuration for serverless environments
function createPrismaClient() {
  // Get database URL and configure for serverless
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Configure connection string for serverless with prepared statement fixes
  const serverlessConfig = new URL(databaseUrl)
  
  // CRITICAL: Disable prepared statements to prevent 42P05 errors in serverless
  serverlessConfig.searchParams.set('pgbouncer', 'true')
  
  // Optimize for serverless environments
  serverlessConfig.searchParams.set('connection_limit', '1')     // Minimal connections for serverless
  serverlessConfig.searchParams.set('pool_timeout', '20')       // Longer timeout for cold starts
  serverlessConfig.searchParams.set('connect_timeout', '60')    // Extended connection timeout
  
  const client = new PrismaClient({
    datasources: {
      db: {
        url: serverlessConfig.toString(),
      },
    },
    
    // Minimal logging in production to avoid overhead
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    
    // Configure error formatting for better debugging
    errorFormat: 'pretty',
  })

  // Client configured for serverless environments

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Enhanced connection health validation with 42P05 detection
export async function validatePrismaConnection(): Promise<boolean> {
  try {
    // Use simple query to avoid prepared statement conflicts
    await prisma.$queryRaw`SELECT 1 as health_check`
    return true
  } catch (error) {
    console.error('❌ Prisma connection validation failed:', error)
    
    // Check for specific PostgreSQL prepared statement error
    if (isPreparedStatementError(error)) {
      console.error('🚨 PostgreSQL 42P05 Error: Prepared statement already exists')
      return false
    }
    
    return false
  }
}

// Enhanced connection recovery with prepared statement cache clearing
export async function recoverPrismaConnection(): Promise<boolean> {
  console.log('🔄 Attempting enhanced Prisma connection recovery...')
  
  try {
    // Force disconnect to clear any cached prepared statements
    await prisma.$disconnect()
    
    // Small delay to ensure complete disconnection
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Reconnect with fresh state
    await prisma.$connect()
    
    // Verify connection with simple query
    await prisma.$queryRaw`SELECT 1 as recovery_test`
    
    console.log('✅ Prisma connection recovery successful')
    return true
  } catch (error) {
    console.error('❌ Prisma connection recovery failed:', error)
    
    if (isPreparedStatementError(error)) {
      console.error('🚨 Persistent prepared statement error detected')
      // Force complete client reset on 42P05 errors
      return await forcePrismaReset()
    }
    
    return false
  }
}

// Detect PostgreSQL 42P05 prepared statement errors
function isPreparedStatementError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message || ''
  const errorCode = error.code || ''
  
  // PostgreSQL Error Code 42P05: "prepared statement already exists"
  return (
    errorCode === '42P05' ||
    errorMessage.includes('prepared statement') ||
    errorMessage.includes('already exists') ||
    errorMessage.includes('d1') || // Common prepared statement name
    errorMessage.includes('d2') ||
    errorMessage.includes('ConnectionError')
  )
}

// Force complete Prisma client reset for severe 42P05 conflicts
async function forcePrismaReset(): Promise<boolean> {
  console.log('🔄 Force resetting Prisma client due to prepared statement conflicts...')
  
  try {
    // Forcefully disconnect and clear global instance
    await prisma.$disconnect()
    
    // Clear global Prisma instance to force recreation
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = undefined
    }
    
    // Wait for complete cleanup
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Test with new client instance
    const testClient = createPrismaClient()
    await testClient.$queryRaw`SELECT 1 as reset_test`
    await testClient.$disconnect()
    
    console.log('✅ Prisma client force reset successful')
    return true
  } catch (error) {
    console.error('❌ Prisma client force reset failed:', error)
    return false
  }
}

// Handle specific 42P05 errors in API routes
export async function handlePreparedStatementError(error: any): Promise<void> {
  if (isPreparedStatementError(error)) {
    console.log('🔄 Handling PostgreSQL 42P05 prepared statement error...')
    
    // Attempt recovery
    const recovered = await recoverPrismaConnection()
    
    if (!recovered) {
      console.log('🔄 Standard recovery failed, attempting force reset...')
      await forcePrismaReset()
    }
  }
}

// Optimized query execution with automatic 42P05 retry
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (isPreparedStatementError(error) && attempt < maxRetries) {
        console.log(`🔄 Attempt ${attempt}: 42P05 error detected, retrying...`)
        await handlePreparedStatementError(error)
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 100))
        continue
      }
      
      // Non-42P05 error or max retries exceeded
      throw error
    }
  }
  
  throw lastError
}

// Safe disconnect for serverless cleanup
export async function safeDisconnect(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('✅ Prisma client safely disconnected')
  } catch (error) {
    console.error('⚠️ Error during Prisma disconnect:', error)
  }
}

// Connection management for serverless environments (Vercel)
if (process.env.NODE_ENV === 'production') {
  // Handle graceful shutdown
  process.on('beforeExit', async () => {
    console.log('🔄 Process beforeExit: Cleaning up Prisma connections...')
    await safeDisconnect()
  })
  
  process.on('SIGTERM', async () => {
    console.log('🔄 Process SIGTERM: Cleaning up Prisma connections...')
    await safeDisconnect()
    process.exit(0)
  })
}

// Only set global in development to prevent connection reuse issues in production
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} 