import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    console.log('👤 GET /api/users/me - Fetching current user data')
    
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json(
        createApiError('Authentication required'),
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    // Get user from database with organization details
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: {
          include: {
            branding: true,
            settings: true,
            serviceTypes: true
          }
        }
      }
    })

    if (!dbUser) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        createApiError('User not found'),
        { status: 404 }
      )
    }

    console.log('✅ User data retrieved:', {
      userId: dbUser.id,
      email: dbUser.email,
      organizationName: dbUser.organization?.name,
      role: dbUser.role,
      status: dbUser.status
    })

    return NextResponse.json(createApiResponse({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      status: dbUser.status,
      title: dbUser.title,
      phone: dbUser.phone,
      avatarUrl: dbUser.avatarUrl,
      bio: dbUser.bio,
      organization: dbUser.organization ? {
        id: dbUser.organization.id,
        name: dbUser.organization.name,
        slug: dbUser.organization.slug,
        description: dbUser.organization.description,
        website: dbUser.organization.website,
        industry: dbUser.organization.industry,
        branding: dbUser.organization.branding,
        settings: dbUser.organization.settings,
        serviceTypes: dbUser.organization.serviceTypes
      } : null
    }))

  } catch (error) {
    console.error('❌ Get user error:', error)
    return NextResponse.json(
      createApiError(`Failed to fetch user data: ${error instanceof Error ? error.message : 'Unknown error'}`),
      { status: 500 }
    )
  }
} 