import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: 'PASSWORD_TOO_WEAK', message: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
        { status: 400 }
      )
    }

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

    // Find client user
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
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // If user has a password, verify current password
    if (clientUser.hashedPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, clientUser.hashedPassword)
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect' },
          { status: 401 }
        )
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user with new password
    await prisma.clientUser.update({
      where: { id: clientUser.id },
      data: {
        hashedPassword,
        emailVerified: true,
        lastLoginAt: new Date()
      }
    })

    // Generate new token
    const newToken = jwt.sign(
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

    // Set new cookie
    const response = NextResponse.json({
      success: true,
      message: 'Password set successfully'
    })

    response.cookies.set('client-portal-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Client password setup error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 