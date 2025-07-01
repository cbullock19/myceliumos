import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

async function authenticateRequest(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Authentication required')
  }

  // Get user from database with organization
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      organization: true
    }
  })

  if (!dbUser || !dbUser.organization) {
    throw new Error('User not found in database - please complete onboarding')
  }

  return { user, dbUser, organizationId: dbUser.organizationId }
}

// GET /api/deliverables/[id] - Get specific deliverable
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliverableId } = await params
    console.log(`📋 GET /api/deliverables/${deliverableId} - Fetching deliverable details`)
    
    const { dbUser, organizationId } = await authenticateRequest(request)

    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id: deliverableId,
        organizationId,
        // Non-admins can only see their assigned deliverables
        ...(dbUser.role !== 'ADMIN' && { assignedUserId: dbUser.id })
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
            contactEmail: true,
            contactPhone: true
          }
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            slug: true,
            deliverableFields: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { startTime: 'desc' }
        }
      }
    })

    if (!deliverable) {
      return NextResponse.json(
        createApiError('Deliverable not found or not accessible'),
        { status: 404 }
      )
    }

    console.log(`✅ Found deliverable: ${deliverable.title}`)

    return NextResponse.json(createApiResponse(deliverable))

  } catch (error) {
    console.error(`❌ GET /api/deliverables/[id] error:`, error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to fetch deliverable'),
      { status: 500 }
    )
  }
}

// PUT /api/deliverables/[id] - Update deliverable
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliverableId } = await params
    console.log(`📋 PUT /api/deliverables/${deliverableId} - Updating deliverable`)
    
    const { dbUser, organizationId } = await authenticateRequest(request)
    const body = await request.json()

    const {
      title,
      description,
      assignedUserId,
      dueDate,
      priority,
      status,
      customFields
    } = body

    // Check if deliverable exists and user has access
    const existingDeliverable = await prisma.deliverable.findFirst({
      where: {
        id: deliverableId,
        organizationId,
        // Non-admins can only edit their assigned deliverables
        ...(dbUser.role !== 'ADMIN' && { assignedUserId: dbUser.id })
      }
    })

    if (!existingDeliverable) {
      return NextResponse.json(
        createApiError('Deliverable not found or not accessible'),
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (customFields !== undefined) updateData.customFields = customFields
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    // Handle status changes
    if (status !== undefined && status !== existingDeliverable.status) {
      updateData.status = status
      
      // Track completion
      if (status === 'COMPLETED' && existingDeliverable.status !== 'COMPLETED') {
        updateData.completedAt = new Date()
        updateData.completedById = dbUser.id
      } else if (status !== 'COMPLETED') {
        updateData.completedAt = null
        updateData.completedById = null
      }
    }

    // Handle assignment changes (admin only)
    if (assignedUserId !== undefined && dbUser.role === 'ADMIN') {
      if (assignedUserId) {
        // Verify assigned user belongs to organization
        const assignedUser = await prisma.user.findFirst({
          where: {
            id: assignedUserId,
            organizationId
          }
        })

        if (!assignedUser) {
          return NextResponse.json(
            createApiError('Assigned user not found or not accessible'),
            { status: 404 }
          )
        }
      }
      updateData.assignedUserId = assignedUserId
    }

    // Update the deliverable
    const updatedDeliverable = await prisma.deliverable.update({
      where: { id: deliverableId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        completedBy: {
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
        action: 'deliverable.updated',
        resourceType: 'Deliverable',
        resourceId: deliverableId,
        metadata: {
          changes: Object.keys(updateData),
          deliverableTitle: updatedDeliverable.title,
          ...(status && status !== existingDeliverable.status && { 
            statusChange: `${existingDeliverable.status} → ${status}` 
          })
        }
      }
    })

    console.log(`✅ Updated deliverable: ${updatedDeliverable.title}`)

    return NextResponse.json(
      createApiResponse(updatedDeliverable, 'Deliverable updated successfully')
    )

  } catch (error) {
    console.error(`❌ PUT /api/deliverables/[id] error:`, error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to update deliverable'),
      { status: 500 }
    )
  }
}

// DELETE /api/deliverables/[id] - Delete deliverable (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliverableId } = await params
    console.log(`🗑️ DELETE /api/deliverables/${deliverableId} - Deleting deliverable`)
    
    const { dbUser, organizationId } = await authenticateRequest(request)

    // Only admins can delete deliverables
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        createApiError('Only administrators can delete deliverables'),
        { status: 403 }
      )
    }

    // Check if deliverable exists
    const existingDeliverable = await prisma.deliverable.findFirst({
      where: {
        id: deliverableId,
        organizationId
      },
      include: {
        client: { select: { name: true } },
        _count: {
          select: {
            comments: true,
            timeEntries: true
          }
        }
      }
    })

    if (!existingDeliverable) {
      return NextResponse.json(
        createApiError('Deliverable not found'),
        { status: 404 }
      )
    }

    // Delete the deliverable (cascading deletes will handle comments and time entries)
    await prisma.deliverable.delete({
      where: { id: deliverableId }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: dbUser.id,
        action: 'deliverable.deleted',
        resourceType: 'Deliverable',
        resourceId: deliverableId,
        metadata: {
          deliverableTitle: existingDeliverable.title,
          clientName: existingDeliverable.client.name,
          commentsDeleted: existingDeliverable._count.comments,
          timeEntriesDeleted: existingDeliverable._count.timeEntries
        }
      }
    })

    console.log(`✅ Deleted deliverable: ${existingDeliverable.title}`)

    return NextResponse.json(
      createApiResponse(null, 'Deliverable deleted successfully')
    )

  } catch (error) {
    console.error(`❌ DELETE /api/deliverables/[id] error:`, error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to delete deliverable'),
      { status: 500 }
    )
  }
} 