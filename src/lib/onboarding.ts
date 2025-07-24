import { createSupabaseClient } from './supabase'

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
 * Client-side onboarding status check using only Supabase metadata
 * Database operations are handled via API routes
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

    // Check Supabase metadata (fastest check)
    const onboardingComplete = user.user_metadata?.onboarding_complete === true
    
    if (onboardingComplete) {
      // User has completed onboarding according to Supabase metadata
      return {
        needsOnboarding: false,
        hasOrganization: true,
        onboardingCompleted: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || null
        },
        organization: {
          id: user.user_metadata?.organizationId || '',
          name: user.user_metadata?.organizationName || '',
          slug: user.user_metadata?.organizationSlug || ''
        }
      }
    }

    // If onboarding is not complete, check with API for detailed status
    try {
      const response = await fetch('/api/auth/check-onboarding')
      const result = await response.json()
      
      if (response.ok && result.data) {
        const { needsOnboarding, needsOrganizationOnboarding, userStatus, organization } = result.data
        
        return {
          needsOnboarding: needsOnboarding || needsOrganizationOnboarding,
          hasOrganization: !!organization,
          onboardingCompleted: userStatus === 'ACTIVE',
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || null
          },
          organization: organization || null
        }
      }
    } catch (apiError) {
      console.warn('API check failed, falling back to metadata:', apiError)
    }

    // Fallback: assume onboarding is needed
    return {
      needsOnboarding: true,
      hasOrganization: false,
      onboardingCompleted: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null
      },
      organization: null
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