import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

// Helper function to authenticate requests
async function authenticateRequest(request: NextRequest) {
  console.log('🔐 Authenticating count request...')
  
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Invalid auth header in count route')
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.split(' ')[1]
  const supabase = createSupabaseClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    console.error('❌ Auth failed in count route:', authError)
    throw new Error('Invalid token or unauthorized')
  }

  // Get the user's organization from Prisma database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true }
  })

  if (!dbUser || !dbUser.organization) {
    console.error('❌ User has no organization in count route')
    throw new Error('User not found in database - please complete onboarding')
  }

  console.log('✅ Count request authenticated for org:', dbUser.organization.name)

  return {
    user: dbUser,
    organizationId: dbUser.organizationId,
    organization: dbUser.organization
  }
}

// GET /api/clients/count - Get client count for organization
export async function GET(request: NextRequest) {
  try {
    console.log('🔢 GET /api/clients/count - Fetching client count')
    
    const { organizationId, organization } = await authenticateRequest(request)

    const count = await prisma.client.count({
      where: {
        organizationId,
        status: 'ACTIVE'
      }
    })

    console.log('✅ Client count for', organization.name + ':', count)
    return NextResponse.json(createApiResponse({ count }))
  } catch (error) {
    console.error('❌ GET /api/clients/count error:', error)
    
    if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('unauthorized') || error.message.includes('onboarding'))) {
      return NextResponse.json(
        createApiError(`Authentication error: ${error.message}`),
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      createApiError(`Server error: ${error instanceof Error ? error.message : 'Failed to fetch client count'}`),
      { status: 500 }
    )
  }
} 