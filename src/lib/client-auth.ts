import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export interface ClientUser {
  id: string
  email: string
  name: string
  role: 'PRIMARY' | 'COLLABORATOR'
  title?: string
  phone?: string
  lastLoginAt?: string
  canApprove: boolean
  canDownload: boolean
  canComment: boolean
}

export interface ClientSession {
  clientUser: ClientUser
  clientId: string
  organizationId: string
}

export async function getClientSession(request: NextRequest): Promise<ClientSession | null> {
  try {
    const token = request.cookies.get('client-portal-token')?.value

    if (!token) {
      return null
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any

    // Find client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: decoded.clientUserId },
      include: {
        client: true
      }
    })

    if (!clientUser || !clientUser.isActive) {
      return null
    }

    return {
      clientUser: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        role: clientUser.role as 'PRIMARY' | 'COLLABORATOR',
        title: clientUser.title,
        phone: clientUser.phone,
        lastLoginAt: clientUser.lastLoginAt?.toISOString(),
        canApprove: clientUser.canApprove,
        canDownload: clientUser.canDownload,
        canComment: clientUser.canComment
      },
      clientId: clientUser.clientId,
      organizationId: clientUser.client.organizationId
    }
  } catch (error) {
    console.error('Client session validation error:', error)
    return null
  }
}

export function requireClientAuth(handler: (request: NextRequest, session: ClientSession) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const session = await getClientSession(request)

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, session)
  }
}

export function requireClientPermission(permission: 'canApprove' | 'canDownload' | 'canComment') {
  return function(handler: (request: NextRequest, session: ClientSession) => Promise<Response>) {
    return requireClientAuth(async (request: NextRequest, session: ClientSession) => {
      if (!session.clientUser[permission]) {
        return new Response(
          JSON.stringify({ error: 'FORBIDDEN', message: 'Insufficient permissions' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      return handler(request, session)
    })
  }
} 