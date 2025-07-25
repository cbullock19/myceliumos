import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client-auth/me - Checking client session')
    
    // Get the client auth token from cookies
    const token = request.cookies.get('client-auth-token')?.value
    
    if (!token) {
      console.log('❌ No client auth token found in cookies')
      return NextResponse.json(createApiError('No authentication token', 401), { status: 401 })
    }

    // Verify the JWT token
    let decoded: any
    try {
      console.log('🔍 Verifying client auth token...')
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
      console.log('✅ Client auth token verified')
    } catch (error) {
      console.error('❌ Client auth token verification failed:', error)
      return NextResponse.json(createApiError('Invalid authentication token', 401), { status: 401 })
    }

    // Get the client user from database
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
      console.log('❌ Client user not found in database')
      return NextResponse.json(createApiError('User not found', 404), { status: 404 })
    }

    if (!clientUser.isActive) {
      console.log('❌ Client user is not active')
      return NextResponse.json(createApiError('User account is not active', 403), { status: 403 })
    }

    console.log('✅ Client user session validated successfully')

    // Return client user data and organization branding
    return NextResponse.json(createApiResponse({
      clientUser: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        role: clientUser.role,
        title: clientUser.title,
        phone: clientUser.phone,
        lastLoginAt: clientUser.lastLoginAt?.toISOString(),
        canApprove: clientUser.canApprove,
        canDownload: clientUser.canDownload,
        canComment: clientUser.canComment
      },
      organizationBranding: clientUser.client.organization.branding ? {
        primaryColor: clientUser.client.organization.branding.primaryColor,
        logoUrl: clientUser.client.organization.branding.logoUrl,
        companyName: clientUser.client.organization.name,
        customCSS: clientUser.client.organization.branding.customCSS
      } : {
        primaryColor: '#059669',
        companyName: clientUser.client.organization.name
      }
    }))

  } catch (error) {
    console.error('❌ Client session validation error:', error)
    return NextResponse.json(createApiError('Failed to validate session'), { status: 500 })
  }
} 