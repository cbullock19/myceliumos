import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    console.log(`🔐 Testing login for: ${email}`)
    
    // Create a server-side Supabase client for testing
    const supabase = await createSupabaseServerClient()
    
    // Attempt to sign in with the provided credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    console.log('🔐 Login test result:', {
      success: !error,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at
      } : null,
      session: data.session ? 'Session created' : 'No session',
      error: error?.message
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.status,
        details: 'Server-side authentication failed'
      }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({
        success: false,
        error: 'No user returned from authentication',
        details: 'Authentication succeeded but no user data received'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at,
        createdAt: data.user.created_at
      },
      session: {
        accessToken: data.session?.access_token ? 'Present' : 'Missing',
        refreshToken: data.session?.refresh_token ? 'Present' : 'Missing',
        expiresAt: data.session?.expires_at
      }
    })

  } catch (error) {
    console.error('❌ Login test error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 