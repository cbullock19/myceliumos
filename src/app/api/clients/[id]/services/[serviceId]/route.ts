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

// PUT /api/clients/[id]/services/[serviceId] - Update service assignment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id: clientId, serviceId } = await params
    const { dbUser, organizationId } = await authenticateRequest(request)

    const body = await request.json()
    const { status, role, isActive } = body

    // Find the assignment
    const assignment = await prisma.clientAssignment.findFirst({
      where: {
        id: serviceId,
        clientId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        },
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

    if (!assignment) {
      return NextResponse.json(
        createApiError('Service assignment not found'),
        { status: 404 }
      )
    }

    // Verify client belongs to organization
    if (assignment.client.organizationId !== organizationId) {
      return NextResponse.json(
        createApiError('Unauthorized access to client'),
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {
      statusUpdatedBy: dbUser.id,
      statusUpdatedAt: new Date()
    }

    if (status) updateData.status = status
    if (role) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    // Update the assignment
    const updatedAssignment = await prisma.clientAssignment.update({
      where: {
        id: serviceId
      },
      data: updateData,
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

    // Create activity log for status changes
    if (status && status !== assignment.status) {
      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: dbUser.id,
          action: 'client.service_status_changed',
          resourceType: 'ClientAssignment',
          resourceId: serviceId,
          metadata: {
            clientName: assignment.client.name,
            serviceName: assignment.serviceType.name,
            oldStatus: assignment.status,
            newStatus: status,
            updatedBy: dbUser.name
          }
        }
      })
    }

    console.log(`✅ Updated ${assignment.serviceType.name} service status for ${assignment.client.name}: ${assignment.status} → ${status}`)

    return NextResponse.json(
      createApiResponse(updatedAssignment, 'Service assignment updated successfully')
    )

  } catch (error) {
    console.error('PUT /api/clients/[id]/services/[serviceId] error:', error)
    
    if (error instanceof Error && error.message.includes('Authorization')) {
      return NextResponse.json(
        createApiError(error.message),
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      createApiError('Failed to update service assignment'),
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id]/services/[serviceId] - Remove service assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id: clientId, serviceId } = await params
    const { dbUser, organizationId } = await authenticateRequest(request)

    // Find the assignment
    const assignment = await prisma.clientAssignment.findFirst({
      where: {
        id: serviceId,
        clientId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        createApiError('Service assignment not found'),
        { status: 404 }
      )
    }

    // Verify client belongs to organization
    if (assignment.client.organizationId !== organizationId) {
      return NextResponse.json(
        createApiError('Unauthorized access to client'),
        { status: 403 }
      )
    }

    // Delete the assignment
    await prisma.clientAssignment.delete({
      where: {
        id: serviceId
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: dbUser.id,
        action: 'client.service_unassigned',
        resourceType: 'ClientAssignment',
        resourceId: serviceId,
        metadata: {
          clientName: assignment.client.name,
          serviceName: assignment.serviceType.name,
          removedBy: dbUser.name
        }
      }
    })

    console.log(`✅ Removed ${assignment.serviceType.name} service from ${assignment.client.name}`)

    return NextResponse.json(
      createApiResponse(null, 'Service assignment removed successfully')
    )

  } catch (error) {
    console.error('DELETE /api/clients/[id]/services/[serviceId] error:', error)
    
    if (error instanceof Error && error.message.includes('Authorization')) {
      return NextResponse.json(
        createApiError(error.message),
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      createApiError('Failed to remove service assignment'),
      { status: 500 }
    )
  }
} 