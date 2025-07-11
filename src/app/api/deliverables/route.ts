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

// GET /api/deliverables - List deliverables (filtered by user permissions)
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/deliverables - Fetching deliverables list')
    
    const { dbUser, organizationId } = await authenticateRequest(request)
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const status = searchParams.get('status') // 'PENDING', 'IN_PROGRESS', etc.
    const clientId = searchParams.get('clientId')
    const assignedToMe = searchParams.get('assignedToMe') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause based on user permissions
    const whereClause: any = {
      organizationId
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status
    }

    // Filter by client if provided
    if (clientId) {
      whereClause.clientId = clientId
    }

    // Filter by assignment based on user role
    if (dbUser.role === 'ADMIN') {
      // Admins can see all deliverables
      if (assignedToMe) {
        whereClause.assignedUserId = dbUser.id
      }
    } else {
      // Non-admins can only see their assigned deliverables
      whereClause.assignedUserId = dbUser.id
    }

    const deliverables = await prisma.deliverable.findMany({
      where: whereClause,
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
            slug: true,
            color: true
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
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.deliverable.count({
      where: whereClause
    })

    console.log(`✅ Found ${deliverables.length} deliverables for user ${dbUser.name}`)

    return NextResponse.json(createApiResponse({
      deliverables,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + deliverables.length < totalCount
      }
    }))

  } catch (error) {
    console.error('❌ GET /api/deliverables error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to fetch deliverables'),
      { status: 500 }
    )
  }
}

// POST /api/deliverables - Create new deliverable
export async function POST(request: NextRequest) {
  try {
    console.log('📋 POST /api/deliverables - Creating new deliverable')
    
    const { dbUser, organizationId } = await authenticateRequest(request)
    const body = await request.json()

    const {
      title,
      description,
      clientId,
      serviceTypeId,
      projectId,
      milestoneId,
      assignedUserId,
      dueDate,
      priority = 'MEDIUM',
      customFields = {}
    } = body

    console.log('📋 Deliverable creation data:', {
      title,
      clientId,
      serviceTypeId,
      projectId: projectId || 'none',
      assignedUserId: assignedUserId || 'null/empty',
      priority
    })

    // Validate required fields
    if (!title || !clientId || !serviceTypeId) {
      return NextResponse.json(
        createApiError('Title, client, and service type are required'),
        { status: 400 }
      )
    }

    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId
      }
    })

    if (!client) {
      return NextResponse.json(
        createApiError('Client not found or not accessible'),
        { status: 404 }
      )
    }

    // Verify service type belongs to organization
    const serviceType = await prisma.serviceType.findFirst({
      where: {
        id: serviceTypeId,
        organizationId
      }
    })

    if (!serviceType) {
      return NextResponse.json(
        createApiError('Service type not found or not accessible'),
        { status: 404 }
      )
    }

    // Verify project (if provided) belongs to organization and client
    let validProjectId = null
    if (projectId && projectId.trim() !== '') {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
          clientId // Project must belong to the same client
        }
      })

      if (!project) {
        return NextResponse.json(
          createApiError('Project not found or not accessible for this client'),
          { status: 404 }
        )
      }
      validProjectId = projectId
    }

    // Verify assigned user (if provided) belongs to organization
    let validAssignedUserId = null
    if (assignedUserId && assignedUserId.trim() !== '') {
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
      validAssignedUserId = assignedUserId
    }

    // Verify milestone (if provided) belongs to the selected project
    let validMilestoneId = null
    if (milestoneId && milestoneId.trim() !== '') {
      if (!projectId) {
        return NextResponse.json(
          createApiError('ProjectId is required when assigning a milestone'),
          { status: 400 }
        )
      }
      const milestone = await prisma.projectMilestone.findFirst({
        where: {
          id: milestoneId,
          projectId,
          project: { organizationId }
        }
      })
      if (!milestone) {
        return NextResponse.json(
          createApiError('Milestone not found or does not belong to the selected project'),
          { status: 400 }
        )
      }
      validMilestoneId = milestoneId
    }

    // Create the deliverable
    console.log('📋 Creating deliverable with assignedUserId:', validAssignedUserId)
    
    const deliverable = await prisma.deliverable.create({
      data: {
        title,
        description,
        clientId,
        serviceTypeId,
        projectId: validProjectId,
        milestoneId: validMilestoneId,
        organizationId,
        assignedUserId: validAssignedUserId,
        createdById: dbUser.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        customFields,
        status: 'PENDING'
      },
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
        }
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: dbUser.id,
        action: 'deliverable.created',
        resourceType: 'Deliverable',
        resourceId: deliverable.id,
        metadata: {
          deliverableTitle: title,
          clientName: client.name,
          serviceTypeName: serviceType.name,
          assignedTo: assignedUserId
        }
      }
    })

    console.log(`✅ Created deliverable: ${title} for client ${client.name}`)

    return NextResponse.json(
      createApiResponse(deliverable, 'Deliverable created successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ POST /api/deliverables error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to create deliverable'),
      { status: 500 }
    )
  }
} 