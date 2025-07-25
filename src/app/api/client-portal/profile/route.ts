import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client-portal/profile - Loading profile data')
    
    // Get token from cookies
    const token = request.cookies.get('client-auth-token')?.value

    if (!token) {
      console.log('❌ No client auth token found')
      return NextResponse.json(createApiError('Not authenticated', 401), { status: 401 })
    }

    // Verify the token
    let decoded: any
    try {
      console.log('🔍 Verifying client auth token...')
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
      console.log('✅ Client auth token verified')
    } catch (error) {
      console.error('❌ Client auth token verification failed:', error)
      return NextResponse.json(createApiError('Invalid token', 401), { status: 401 })
    }

    // Get client user with full details
    console.log('🔍 Looking up client user with ID:', decoded.clientUserId)
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: decoded.clientUserId },
      include: {
        client: {
          include: {
            organization: {
              include: {
                branding: true
              }
            }
          }
        }
      }
    })

    if (!clientUser) {
      console.log('❌ Client user not found')
      return NextResponse.json(createApiError('User not found', 404), { status: 404 })
    }

    if (!clientUser.isActive) {
      console.log('❌ Client user is not active')
      return NextResponse.json(createApiError('User account is not active', 403), { status: 403 })
    }

    // Get user activity stats
    const [totalDeliverables, completedDeliverables, recentProjects] = await Promise.all([
      prisma.deliverable.count({
        where: { clientId: clientUser.clientId }
      }),
      prisma.deliverable.count({
        where: { 
          clientId: clientUser.clientId,
          status: 'COMPLETED'
        }
      }),
      prisma.project.count({
        where: { clientId: clientUser.clientId }
      })
    ])

    console.log('✅ Profile data loaded successfully')

    const profileData = {
      user: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        title: clientUser.title,
        phone: clientUser.phone,
        role: clientUser.role,
        lastLoginAt: clientUser.lastLoginAt?.toISOString(),
        createdAt: clientUser.createdAt.toISOString()
      },
      organization: {
        name: clientUser.client.organization.name,
        contactEmail: 'support@myceliumos.app', // Default support email
        supportPhone: null // Not stored in current schema
      },
      permissions: {
        canApprove: clientUser.canApprove,
        canDownload: clientUser.canDownload,
        canComment: clientUser.canComment
      },
      activity: {
        totalDeliverables,
        completedDeliverables,
        recentProjects,
        lastActivity: clientUser.lastLoginAt?.toISOString() || clientUser.createdAt.toISOString()
      }
    }

    return NextResponse.json(createApiResponse(profileData))

  } catch (error) {
    console.error('❌ Profile data error:', error)
    return NextResponse.json(createApiError('Failed to load profile data'), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT /api/client-portal/profile - Updating profile')
    
    // Get token from cookies
    const token = request.cookies.get('client-auth-token')?.value

    if (!token) {
      return NextResponse.json(createApiError('Not authenticated', 401), { status: 401 })
    }

    // Verify the token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json(createApiError('Invalid token', 401), { status: 401 })
    }

    // Get request body
    const { name, title, phone } = await request.json()

    // Update client user
    const updatedUser = await prisma.clientUser.update({
      where: { id: decoded.clientUserId },
      data: {
        name: name || undefined,
        title: title || undefined,
        phone: phone || undefined
      }
    })

    console.log('✅ Profile updated successfully')

    return NextResponse.json(createApiResponse({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        title: updatedUser.title,
        phone: updatedUser.phone,
        role: updatedUser.role
      }
    }))

  } catch (error) {
    console.error('❌ Profile update error:', error)
    return NextResponse.json(createApiError('Failed to update profile'), { status: 500 })
  }
} 