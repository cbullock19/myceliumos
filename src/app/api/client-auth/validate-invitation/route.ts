import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/client-auth/validate-invitation - Starting token validation')
    
    const { token } = await request.json()

    if (!token) {
      console.log('❌ No token provided')
      return NextResponse.json(createApiError('Token is required', 400), { status: 400 })
    }

    console.log('🔍 Token received, length:', token.length)

    // Verify and decode the token
    let decoded: any
    try {
      console.log('🔍 Attempting to verify JWT token...')
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
      console.log('✅ JWT token verified successfully')
    } catch (error) {
      console.error('❌ JWT verification failed:', error)
      return NextResponse.json(createApiError('Invalid token', 401), { status: 401 })
    }

    // Check if token is for client invitation
    if (decoded.type !== 'client_invitation') {
      console.log('❌ Invalid token type:', decoded.type)
      return NextResponse.json(createApiError('Invalid token type', 401), { status: 401 })
    }

    console.log('✅ Token type verified as client_invitation')

    // Check if token has expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      console.log('❌ Token has expired')
      return NextResponse.json(createApiError('TOKEN_EXPIRED', 401), { status: 401 })
    }

    console.log('✅ Token is not expired')

    // Get client and organization details
    console.log('🔍 Looking up client with ID:', decoded.clientId)
    const client = await prisma.client.findUnique({
      where: { id: decoded.clientId },
      include: {
        organization: {
          include: {
            branding: true
          }
        }
      }
    })

    if (!client) {
      console.log('❌ Client not found for ID:', decoded.clientId)
      return NextResponse.json(createApiError('Client not found', 404), { status: 404 })
    }

    console.log('✅ Client found:', client.name)

    // Check if client user already exists and is active
    console.log('🔍 Checking for existing client user with email:', decoded.email)
    const existingClientUser = await prisma.clientUser.findUnique({
      where: { email: decoded.email }
    })

    if (existingClientUser && existingClientUser.isActive) {
      console.log('❌ User already active:', decoded.email)
      return NextResponse.json(createApiError('User already active', 409), { status: 409 })
    }

    console.log('✅ No active user found, proceeding with validation')

    console.log('✅ Token validation successful, returning response')
    return NextResponse.json(createApiResponse({
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      clientName: client.name,
      organizationName: client.organization.name,
      organizationBranding: client.organization.branding
    }))

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(createApiError('Failed to validate token'), { status: 500 })
  }
} 