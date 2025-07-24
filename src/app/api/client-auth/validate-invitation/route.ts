import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(createApiError('Token is required', 400), { status: 400 })
    }

    // Verify and decode the token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json(createApiError('Invalid token', 401), { status: 401 })
    }

    // Check if token is for client invitation
    if (decoded.type !== 'client_invitation') {
      return NextResponse.json(createApiError('Invalid token type', 401), { status: 401 })
    }

    // Check if token has expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return NextResponse.json(createApiError('TOKEN_EXPIRED', 401), { status: 401 })
    }

    // Get client and organization details
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
      return NextResponse.json(createApiError('Client not found', 404), { status: 404 })
    }

    // Check if client user already exists and is active
    const existingClientUser = await prisma.clientUser.findUnique({
      where: { email: decoded.email }
    })

    if (existingClientUser && existingClientUser.isActive) {
      return NextResponse.json(createApiError('User already active', 409), { status: 409 })
    }

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