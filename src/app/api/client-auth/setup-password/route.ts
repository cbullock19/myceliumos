import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, password } = body

    // Handle invitation-based setup
    if (token) {
      return handleInvitationSetup(token, name, password)
    }

    // Handle existing user password update (legacy)
    const { currentPassword, newPassword } = body
    return handlePasswordUpdate(currentPassword, newPassword)

  } catch (error) {
    console.error('Password setup error:', error)
    return NextResponse.json(createApiError('Failed to set password'), { status: 500 })
  }
}

async function handleInvitationSetup(token: string, name: string, password: string) {
  try {
    // Verify and decode the token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json(createApiError('INVALID_TOKEN', 401), { status: 401 })
    }

    // Check if token is for client invitation
    if (decoded.type !== 'client_invitation') {
      return NextResponse.json(createApiError('INVALID_TOKEN', 401), { status: 401 })
    }

    // Check if token has expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return NextResponse.json(createApiError('TOKEN_EXPIRED', 401), { status: 401 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(createApiError('PASSWORD_TOO_WEAK', 400), { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update or create the client user
    const clientUser = await prisma.clientUser.upsert({
      where: { email: decoded.email },
      update: {
        name: name || decoded.name,
        hashedPassword,
        isActive: true,
        emailVerified: true
      },
      create: {
        clientId: decoded.clientId,
        email: decoded.email,
        name: name || decoded.name,
        role: decoded.role,
        hashedPassword,
        isActive: true,
        emailVerified: true,
        canApprove: decoded.permissions?.canApprove ?? (decoded.role === 'PRIMARY'),
        canDownload: decoded.permissions?.canDownload ?? true,
        canComment: decoded.permissions?.canComment ?? true
      }
    })

    // Generate JWT token for immediate login
    const sessionToken = jwt.sign(
      {
        clientUserId: clientUser.id,
        clientId: clientUser.clientId,
        organizationId: decoded.organizationId,
        email: clientUser.email,
        role: clientUser.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Set HTTP-only cookie
    const response = NextResponse.json(createApiResponse({
      message: 'Account setup complete',
      clientUser: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        role: clientUser.role
      }
    }))

    response.cookies.set('client-auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Invitation setup error:', error)
    return NextResponse.json(createApiError('Failed to complete account setup'), { status: 500 })
  }
}

async function handlePasswordUpdate(currentPassword: string, newPassword: string) {
  try {
    // Get the token from cookies - this function doesn't have access to request
    // We'll need to pass it as a parameter or restructure
    return NextResponse.json(createApiError('Legacy password update not implemented', 400), { status: 400 })
  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json(createApiError('Failed to update password'), { status: 500 })
  }
} 