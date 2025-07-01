import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking onboarding status...')
    
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json(createApiResponse({
        isAuthenticated: false,
        needsOnboarding: true,
        user: null
      }))
    }

    console.log('✅ User authenticated:', user.email)

    // Check user in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { 
        organization: {
          include: {
            serviceTypes: true,
            branding: true,
            settings: true
          }
        }
      }
    })

    if (!dbUser) {
      console.log('❌ User not found in database, needs account setup')
      return NextResponse.json(createApiResponse({
        isAuthenticated: true,
        needsOnboarding: true,
        needsAccountSetup: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name
        }
      }))
    }

    if (!dbUser.organization) {
      console.log('❌ User has no organization, needs onboarding')
      return NextResponse.json(createApiResponse({
        isAuthenticated: true,
        needsOnboarding: true,
        needsOrganization: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          status: dbUser.status
        }
      }))
    }

    const hasServiceTypes = dbUser.organization.serviceTypes.length > 0
    
    // Different onboarding logic:
    // - Organization setup: Only if org has no service types (initial setup incomplete)
    // - User profile completion: For any user (including admins) who needs profile completion
    const isAdmin = dbUser.role === 'ADMIN'
    const orgNeedsInitialSetup = !hasServiceTypes
    const userNeedsProfileCompletion = dbUser.status === 'ACTIVE' && (!dbUser.title || !dbUser.name)
    
    // Only the first admin of an unconfigured org needs organization onboarding
    const needsOrganizationOnboarding = isAdmin && orgNeedsInitialSetup
    // All other users (including later-invited admins) need user profile completion
    const needsUserProfileCompletion = !orgNeedsInitialSetup && userNeedsProfileCompletion
    const needsOnboarding = needsOrganizationOnboarding || needsUserProfileCompletion || dbUser.status !== 'ACTIVE'

    console.log('✅ User check complete:', {
      userId: dbUser.id,
      email: dbUser.email,
      organizationId: dbUser.organizationId,
      organizationName: dbUser.organization.name,
      userStatus: dbUser.status,
      userRole: dbUser.role,
      isAdmin,
      serviceTypesCount: dbUser.organization.serviceTypes.length,
      orgNeedsInitialSetup,
      userNeedsProfileCompletion,
      hasProfile: !!(dbUser.title && dbUser.name),
      needsOrganizationOnboarding,
      needsUserProfileCompletion,
      needsOnboarding
    })

    return NextResponse.json(createApiResponse({
      isAuthenticated: true,
      needsOnboarding,
      needsOrganizationOnboarding,
      needsUserProfileCompletion,
      userStatus: dbUser.status,
      isFirstLogin: dbUser.status === 'PENDING', // Users with PENDING status need password change
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        status: dbUser.status,
        organization: {
          id: dbUser.organization.id,
          name: dbUser.organization.name,
          slug: dbUser.organization.slug,
          serviceTypesCount: dbUser.organization.serviceTypes.length
        }
      }
    }))

  } catch (error) {
    console.error('❌ Check onboarding error:', error)
    return NextResponse.json(
      createApiError(`Failed to check onboarding status: ${error instanceof Error ? error.message : 'Unknown error'}`),
      { status: 500 }
    )
  }
} 