import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log(`🔍 DEBUG: Checking user status for ${email}`)

    // Check database user
    const dbUser = await prisma.user.findFirst({
      where: { email: email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        temporaryPassword: true,
        invitedAt: true,
        createdAt: true,
        organizationId: true
      }
    })

    console.log('📝 Database user:', dbUser)

    // Check Supabase Auth user
    const supabaseAdmin = createSupabaseAdminClient()
    let authUser = null
    let authError = null

    if (dbUser) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(dbUser.id)
      authUser = data.user
      authError = error
    }

    console.log('🔐 Supabase Auth user:', authUser ? {
      id: authUser.id,
      email: authUser.email,
      email_confirmed_at: authUser.email_confirmed_at,
      created_at: authUser.created_at,
      user_metadata: authUser.user_metadata
    } : 'Not found')

    if (authError) {
      console.log('❌ Supabase Auth error:', authError)
    }

    // Test login attempt (if we have the temp password)
    let loginTest = null
    if (dbUser?.temporaryPassword) {
      try {
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email
        })
        
        loginTest = {
          canGenerateMagicLink: !loginError,
          magicLinkError: loginError?.message
        }
      } catch (e) {
        loginTest = { error: 'Failed to test login capabilities' }
      }
    }

    return NextResponse.json({
      email: email,
      database: {
        found: !!dbUser,
        user: dbUser
      },
      supabaseAuth: {
        found: !!authUser,
        user: authUser ? {
          id: authUser.id,
          email: authUser.email,
          emailConfirmed: !!authUser.email_confirmed_at,
          createdAt: authUser.created_at,
          metadata: authUser.user_metadata
        } : null,
        error: authError?.message
      },
      loginTest,
      recommendations: generateRecommendations(dbUser, authUser, authError)
    })

  } catch (error) {
    console.error('❌ Debug user error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

function generateRecommendations(dbUser: any, authUser: any, authError: any) {
  const recommendations = []

  if (!dbUser) {
    recommendations.push('❌ User not found in database - invitation may have failed')
  }

  if (!authUser && dbUser) {
    recommendations.push('❌ User exists in database but not in Supabase Auth - auth account creation failed')
  }

  if (authUser && !authUser.email_confirmed_at) {
    recommendations.push('⚠️ Email not confirmed in Supabase Auth - this could prevent login')
  }

  if (dbUser?.temporaryPassword) {
    recommendations.push(`🔑 Temporary password in database: ${dbUser.temporaryPassword}`)
    recommendations.push('💡 Try logging in with this exact password')
  }

  if (authError) {
    recommendations.push(`❌ Supabase Auth error: ${authError.message}`)
  }

  if (dbUser && authUser && authUser.email_confirmed_at) {
    recommendations.push('✅ User looks properly configured - login should work')
  }

  return recommendations
} 