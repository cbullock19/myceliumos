import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Log configuration - minimal in production for performance
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