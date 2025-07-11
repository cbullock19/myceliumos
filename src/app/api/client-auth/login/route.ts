import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find client user by email
    const clientUser = await prisma.clientUser.findUnique({
      where: { email },
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
        { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!clientUser.isActive) {
      return NextResponse.json(
        { error: 'ACCOUNT_INACTIVE', message: 'Your account has been deactivated' },
        { status: 401 }
      )
    }

    // Check if password is set (for first-time login)
    if (!clientUser.hashedPassword) {
      return NextResponse.json(
        { error: 'PASSWORD_SETUP_REQUIRED', message: 'Please set your password first' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, clientUser.hashedPassword)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.clientUser.update({
      where: { id: clientUser.id },
      data: { lastLoginAt: new Date() }
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        clientUserId: clientUser.id,
        clientId: clientUser.clientId,
        organizationId: clientUser.client.organizationId,
        email: clientUser.email,
        role: clientUser.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Set HTTP-only cookie
    const response = NextResponse.json({
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

    // Set secure cookie
    response.cookies.set('client-portal-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Client login error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 