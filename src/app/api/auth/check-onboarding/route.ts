import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
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

    // If user doesn't exist in database yet, they need onboarding
    if (!userProfile) {
      return NextResponse.json({
        data: {
          needsOnboarding: true,
          hasOrganization: false,
          onboardingCompleted: false,
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0]
          }
        }
      })
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
          name: userProfile.name,
          role: userProfile.role,
          status: userProfile.status
        },
        organization: hasOrganization ? {
          id: userProfile.organization!.id,
          name: userProfile.organization!.name,
          slug: userProfile.organization!.slug
        } : null
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