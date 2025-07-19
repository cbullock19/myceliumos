import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { generateOrganizationSlug } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?message=Authentication failed`)
      }

      if (user) {
        console.log('✅ Email confirmation successful for:', user.email)
        
        // Check if this is a new user registration
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser && user.user_metadata) {
          console.log('🆕 Creating new user and organization...')
          
          // Create a temporary organization for the user
          const tempOrganization = await prisma.organization.create({
            data: {
              name: 'Temporary Organization',
              slug: `temp-${user.id}`,
              branding: {
                create: {
                  primaryColor: '#228B22' // Default Mycelium green
                }
              },
              settings: {
                create: {} // Use default settings
              }
            }
          })

          // Create admin user
          await prisma.user.create({
            data: {
              id: user.id,
              organizationId: tempOrganization.id,
              email: user.email!,
              name: user.user_metadata.name,
              role: 'ADMIN',
              status: 'PENDING', // Will be activated after onboarding
              emailVerified: true
            }
          })

          console.log('✅ New user created, redirecting to onboarding...')
          
          // Redirect directly to onboarding for new users
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
        } else {
          console.log('👤 Existing user login...')
          
          // Existing user - check if they need to complete onboarding
          const userWithOrg = await prisma.user.findUnique({
            where: { email: user.email! },
            include: {
              organization: {
                include: {
                  serviceTypes: true
                }
              }
            }
          })

          if (userWithOrg?.organization?.serviceTypes?.length === 0) {
            // Onboarding not completed
            return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
          } else {
            // Regular login to dashboard
            return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
          }
        }
      }
    } catch (error) {
      console.error('Database error in auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?message=Setup failed`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth/signin`)
}

export async function POST(request: NextRequest) {
  // Handle logout
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${request.url.split('/api')[0]}/auth/signin`)
} 