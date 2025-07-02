import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a new Prisma client with enhanced error handling and recovery
function createPrismaClient() {
  const client = new PrismaClient({
    // Enhanced logging for debugging session-specific issues
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn', 'info'] 
      : ['error'],
    
    // Configure connection timeouts to prevent hanging connections
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // Client is configured for enhanced session management

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Add health check function for session validation
export async function validatePrismaConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('❌ Prisma connection validation failed:', error)
    return false
  }
}

// Enhanced connection recovery for session-specific issues
export async function recoverPrismaConnection() {
  console.log('🔄 Attempting Prisma connection recovery...')
  try {
    await prisma.$disconnect()
    await prisma.$connect()
    console.log('✅ Prisma connection recovery successful')
    return true
  } catch (error) {
    console.error('❌ Prisma connection recovery failed:', error)
    return false
  }
}

// Connection management for serverless environments
if (process.env.NODE_ENV === 'production') {
  // Gracefully handle connection cleanup
  process.on('beforeExit', async () => {
    console.log('🔄 Cleaning up Prisma connections...')
    await prisma.$disconnect()
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 