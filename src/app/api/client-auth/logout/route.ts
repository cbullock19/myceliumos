import { NextRequest, NextResponse } from 'next/server'
import { createApiResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/client-auth/logout - Logging out client user')
    
    // Create response with success message
    const response = NextResponse.json(createApiResponse({
      message: 'Logged out successfully'
    }))
    
    // Clear the client auth token cookie
    response.cookies.set('client-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })
    
    console.log('✅ Client user logged out successfully')
    return response
    
  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json(createApiResponse({
      message: 'Logged out successfully'
    }))
  }
} 