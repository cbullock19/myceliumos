import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('client-portal-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'No session found' },
        { status: 401 }
      )
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    } catch (error) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid session' },
        { status: 401 }
      )
    }

    // Find client user with organization data
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: decoded.clientUserId },
      include: {
        client: {
          include: {
            organization: {
              include: {
                branding: true,
                settings: true
              }
            }
          }
        }
      }
    })

    if (!clientUser) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if account is still active
    if (!clientUser.isActive) {
      return NextResponse.json(
        { error: 'ACCOUNT_INACTIVE', message: 'Your account has been deactivated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        clientUser: {
          id: clientUser.id,
          email: clientUser.email,
          name: clientUser.name,
          role: clientUser.role,
          title: clientUser.title,
          phone: clientUser.phone,
          lastLoginAt: clientUser.lastLoginAt,
          canApprove: clientUser.canApprove,
          canDownload: clientUser.canDownload,
          canComment: clientUser.canComment
        },
        organizationBranding: {
          primaryColor: clientUser.client.organization.branding?.primaryColor || '#059669',
          logoUrl: clientUser.client.organization.branding?.logoUrl,
          companyName: clientUser.client.organization.name,
          customCSS: clientUser.client.organization.branding?.customCSS
        }
      }
    })
  } catch (error) {
    console.error('Client session validation error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 