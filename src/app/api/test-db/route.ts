import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...')
    
    // Check if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      console.error('❌ DATABASE_URL is not set')
      return NextResponse.json({
        error: 'DATABASE_URL environment variable is not set',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    console.log('✅ DATABASE_URL is set')
    console.log('🔍 Database URL format:', dbUrl.substring(0, 20) + '...')
    
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    console.log('✅ Database connection successful:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection is working',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      testResult: result
    })
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    
    return NextResponse.json({
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlFormat: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set'
    }, { status: 500 })
  }
} 