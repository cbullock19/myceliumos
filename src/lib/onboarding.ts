import { createSupabaseClient } from './supabase'
import { prisma } from './prisma'

export interface OnboardingStatus {
  needsOnboarding: boolean
  hasOrganization: boolean
  onboardingCompleted: boolean
  user: {
    id: string
    email: string
    name: string | null
  } | null
  organization: {
    id: string
    name: string
    slug: string
  } | null
}

/**
 * Comprehensive onboarding status check that works across all entry points
 * This ensures users complete onboarding regardless of how they arrive
 */
export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    const supabase = createSupabaseClient()
    
    // Get the current user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        needsOnboarding: true,
        hasOrganization: false,
        onboardingCompleted: false,
        user: null,
        organization: null
      }
    }

    // Check Supabase metadata first (fastest check)
    const onboardingComplete = user.user_metadata?.onboarding_complete === true
    
    if (onboardingComplete) {
      // User has completed onboarding according to Supabase metadata
      // Still verify with database for consistency
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { organization: true }
      })

      if (dbUser?.status === 'ACTIVE' && dbUser.organization) {
        return {
          needsOnboarding: false,
          hasOrganization: true,
          onboardingCompleted: true,
          user: {
            id: user.id,
            email: user.email,
            name: dbUser.name
          },
          organization: {
            id: dbUser.organization.id,
            name: dbUser.organization.name,
            slug: dbUser.organization.slug
          }
        }
      }
    }

    // Check database for more detailed status
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    })

    if (!dbUser) {
      return {
        needsOnboarding: true,
        hasOrganization: false,
        onboardingCompleted: false,
        user: {
          id: user.id,
          email: user.email,
          name: null
        },
        organization: null
      }
    }

    // Determine onboarding status
    const hasOrganization = !!dbUser.organization
    const isActiveUser = dbUser.status === 'ACTIVE'
    const needsOnboarding = !hasOrganization || !isActiveUser

    return {
      needsOnboarding,
      hasOrganization,
      onboardingCompleted: isActiveUser,
      user: {
        id: user.id,
        email: user.email,
        name: dbUser.name
      },
      organization: hasOrganization ? {
        id: dbUser.organization!.id,
        name: dbUser.organization!.name,
        slug: dbUser.organization!.slug
      } : null
    }

  } catch (error) {
    console.error('Error checking onboarding status:', error)
    
    // On error, assume onboarding is needed (safer default)
    return {
      needsOnboarding: true,
      hasOrganization: false,
      onboardingCompleted: false,
      user: null,
      organization: null
    }
  }
}

/**
 * Force redirect to onboarding if user hasn't completed it
 * Use this in dashboard and other protected pages
 */
export async function ensureOnboardingComplete(redirectTo: string = '/onboarding'): Promise<boolean> {
  const status = await checkOnboardingStatus()
  
  if (status.needsOnboarding) {
    // Use window.location for hard redirect to avoid hydration issues
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo
    }
    return false
  }
  
  return true
}

/**
 * Update Supabase metadata when onboarding is completed
 * This ensures the metadata is always in sync
 */
export async function markOnboardingComplete(): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase.auth.updateUser({
      data: {
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString()
      }
    })

    if (error) {
      console.error('Failed to update onboarding metadata:', error)
      throw error
    }
  } catch (error) {
    console.error('Error marking onboarding complete:', error)
    throw error
  }
} 