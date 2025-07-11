import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

// Helper function to authenticate requests
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.split(' ')[1]
  const supabase = createSupabaseClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw new Error('Invalid token or unauthorized')
  }

  // Get user from database
  const dbUser = await prisma.user.findFirst({
    where: { email: user.email }
  })

  if (!dbUser) {
    throw new Error('User not found in database')
  }

  return {
    user,
    dbUser,
    organizationId: dbUser.organizationId
  }
}

// POST /api/clients/[id]/services - Add service assignment to client
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: clientId } = context.params
    const { dbUser, organizationId } = await authenticateRequest(request)

    const body = await request.json()
    const { serviceTypeId, userId, role = 'PRIMARY', status = 'ACTIVE' } = body

    if (!serviceTypeId) {
      return NextResponse.json(
        createApiError('Service type ID is required'),
        { status: 400 }
      )
    }

    // Verify client exists and belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId
      }
    })

    if (!client) {
      return NextResponse.json(
        createApiError('Client not found'),
        { status: 404 }
      )
    }

    // Verify service type exists and belongs to organization
    const serviceType = await prisma.serviceType.findFirst({
      where: {
        id: serviceTypeId,
        organizationId
      }
    })

    if (!serviceType) {
      return NextResponse.json(
        createApiError('Service type not found'),
        { status: 404 }
      )
    }

    // Use provided userId or default to current user
    const assignedUserId = userId || dbUser.id

    // Check if assignment already exists
    const existingAssignment = await prisma.clientAssignment.findFirst({
      where: {
        clientId,
        userId: assignedUserId,
        serviceTypeId
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        createApiError('Service assignment already exists'),
        { status: 409 }
      )
    }

    // Create the assignment
    const assignment = await prisma.clientAssignment.create({
      data: {
        clientId,
        userId: assignedUserId,
        serviceTypeId,
        role,
        status,
        isActive: true,
        assignedBy: dbUser.id,
        statusUpdatedBy: dbUser.id
      },
      include: {
        serviceType: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: dbUser.id,
        action: 'client.service_assigned',
        resourceType: 'ClientAssignment',
        resourceId: assignment.id,
        metadata: {
          clientName: client.name,
          serviceName: serviceType.name,
          assignedTo: assignment.user.name,
          status,
          assignedBy: dbUser.name
        }
      }
    })

    console.log(`✅ Added ${serviceType.name} service to client ${client.name}`)

    return NextResponse.json(
      createApiResponse(assignment, 'Service assigned successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/clients/[id]/services error:', error)
    
    if (error instanceof Error && error.message.includes('Authorization')) {
      return NextResponse.json(
        createApiError(error.message),
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      createApiError('Failed to assign service'),
      { status: 500 }
    )
  }
}

// GET /api/clients/[id]/services - Get client's service assignments
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: clientId } = context.params
    const { organizationId } = await authenticateRequest(request)

    // Verify client exists and belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId
      }
    })

    if (!client) {
      return NextResponse.json(
        createApiError('Client not found'),
        { status: 404 }
      )
    }

    const assignments = await prisma.clientAssignment.findMany({
      where: {
        clientId
      },
      include: {
        serviceType: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    console.log(`✅ Retrieved ${assignments.length} service assignments for client ${client.name}`)

    return NextResponse.json(createApiResponse(assignments))

  } catch (error) {
    console.error('GET /api/clients/[id]/services error:', error)
    
    if (error instanceof Error && error.message.includes('Authorization')) {
      return NextResponse.json(
        createApiError(error.message),
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      createApiError('Failed to fetch service assignments'),
      { status: 500 }
    )
  }
} 