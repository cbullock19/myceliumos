import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user has an organization
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: true
      }
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Check if user has completed onboarding (based on status and organization setup)
    const hasOrganization = !!userProfile.organization
    const isActiveUser = userProfile.status === 'ACTIVE'
    const needsOnboarding = !hasOrganization || !isActiveUser

    return NextResponse.json({
      data: {
        needsOnboarding,
        hasOrganization,
        onboardingCompleted: isActiveUser,
        user: {
          id: user.id,
          email: user.email,
          name: userProfile.name
        }
      }
    })

  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 