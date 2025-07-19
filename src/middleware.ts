import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser()

  // If no user, allow the request (auth pages will handle redirects)
  if (error || !user) {
    return res
  }

  // Check if user has completed onboarding via metadata (fastest check)
  const onboardingComplete = user.user_metadata?.onboarding_complete === true

  // Define protected routes that require onboarding completion
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/',
    '/dashboard/analytics',
    '/dashboard/clients',
    '/dashboard/projects',
    '/dashboard/deliverables',
    '/dashboard/service-types',
    '/dashboard/settings',
    '/dashboard/team'
  ]

  // Define onboarding routes
  const onboardingRoutes = ['/onboarding']

  const pathname = req.nextUrl.pathname

  // If user hasn't completed onboarding and is trying to access protected routes
  if (!onboardingComplete && protectedRoutes.some(route => pathname.startsWith(route))) {
    console.log('🔄 Middleware: User needs onboarding, redirecting from', pathname)
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // If user has completed onboarding and is trying to access onboarding
  if (onboardingComplete && onboardingRoutes.some(route => pathname.startsWith(route))) {
    console.log('🔄 Middleware: User completed onboarding, redirecting from', pathname)
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 