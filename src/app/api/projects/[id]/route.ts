import { NextRequest, NextResponse } from 'next/server'
import { prisma, validatePrismaConnection, recoverPrismaConnection } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase'
import { createApiResponse, createApiError } from '@/lib/utils'

// Authentication helper using centralized Supabase helper
async function authenticateRequest(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    console.error('❌ Authentication failed:', error?.message)
    throw new Error('Authentication required')
  }

  console.log('✅ Supabase user authenticated:', {
    id: user.id,
    email: user.email
  })
  
  // Get user's organization from database
  console.log('🔍 Looking up user in database...')
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      organization: true
    }
  })
  
  if (!dbUser) {
    console.error('❌ User not found in database')
    throw new Error('User not found in database - please complete onboarding')
  }
  
  if (dbUser.status !== 'ACTIVE') {
    console.error('❌ User account is not active:', dbUser.status)
    throw new Error('Account not active')
  }
  
  console.log('✅ User found in database with organization:', {
    userId: dbUser.id,
    organizationId: dbUser.organizationId,
    organizationName: dbUser.organization.name,
    userRole: dbUser.role,
    userStatus: dbUser.status
  })
  
  return {
    user: dbUser,
    organization: dbUser.organization
  }
}

// GET /api/projects/[id] - Fetch project details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log(`📋 GET /api/projects/${id} - Fetching project details`)
  
  try {
    // Validate connection health before starting
    const connectionHealthy = await validatePrismaConnection()
    if (!connectionHealthy) {
      console.log('⚠️ Connection unhealthy, attempting recovery...')
      const recovered = await recoverPrismaConnection()
      if (!recovered) {
        return NextResponse.json(createApiError(
          'Database connection issue - please try again in a moment'
        ), { status: 503 })
      }
    }

    const { user, organization } = await authenticateRequest(request)
    
    // Fetch project with related data
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organizationId: organization.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            status: true,
            contactEmail: true,
            contactPerson: true
          }
        },
        deliverables: {
          include: {
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
            _count: {
              select: {
                comments: true
              }
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        },
        _count: {
          select: {
            deliverables: true
          }
        }
      }
    })
    
    if (!project) {
      return NextResponse.json(createApiError('Project not found'), { status: 404 })
    }
    
    console.log(`✅ Found project: ${project.name} with ${project._count.deliverables} deliverables`)
    
    return NextResponse.json(createApiResponse(project))
    
  } catch (error: any) {
    console.error(`❌ GET /api/projects/${id} error:`, error)
    
    // Check if this is a connection-related error and attempt recovery
    if (error instanceof Error && 
        (error.message.includes('prepared statement') || 
         error.message.includes('connection') || 
         error.message.includes('ConnectionError'))) {
      console.log('🔄 Connection error detected, attempting recovery...')
      await recoverPrismaConnection()
    }
    
    if (error.message.includes('Authentication') || error.message.includes('not found in database')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(createApiError('Failed to fetch project'), { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log(`📋 PUT /api/projects/${id} - Updating project`)
  
  try {
    // Validate connection health before starting
    const connectionHealthy = await validatePrismaConnection()
    if (!connectionHealthy) {
      console.log('⚠️ Connection unhealthy, attempting recovery...')
      const recovered = await recoverPrismaConnection()
      if (!recovered) {
        return NextResponse.json(createApiError(
          'Database connection issue - please try again in a moment'
        ), { status: 503 })
      }
    }

    const { user, organization } = await authenticateRequest(request)
    
    const body = await request.json()
    console.log('📋 Project update data:', body)
    
    // Verify project exists and belongs to organization
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        organizationId: organization.id
      }
    })
    
    if (!existingProject) {
      return NextResponse.json(createApiError('Project not found'), { status: 404 })
    }
    
    // If client is being changed, verify the new client belongs to organization
    if (body.clientId && body.clientId !== existingProject.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: body.clientId,
          organizationId: organization.id
        }
      })
      
      if (!client) {
        return NextResponse.json(createApiError(
          'Client not found or does not belong to your organization'
        ), { status: 404 })
      }
    }
    
    // Update project in transaction
    const updatedProject = await prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: id },
        data: {
          name: body.name || existingProject.name,
          description: body.description !== undefined ? body.description : existingProject.description,
          clientId: body.clientId || existingProject.clientId,
          status: body.status || existingProject.status,
          priority: body.priority || existingProject.priority,
          startDate: body.startDate ? new Date(body.startDate) : existingProject.startDate,
          endDate: body.endDate ? new Date(body.endDate) : existingProject.endDate,
          budgetAmount: body.budget !== undefined ? 
            (body.budget ? parseFloat(body.budget) : null) : 
            existingProject.budgetAmount,
          managerId: body.managerId || existingProject.managerId
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        }
      })

      // Create activity log
      await tx.activityLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: 'project.updated',
          resourceType: 'Project',
          resourceId: project.id,
          metadata: {
            projectName: project.name,
            clientName: project.client.name,
            updatedBy: user.name,
            changes: Object.keys(body)
          }
        }
      })

      return project
    })
    
    console.log(`✅ Updated project: ${updatedProject.name}`)
    
    return NextResponse.json(createApiResponse(updatedProject, 'Project updated successfully'))
    
  } catch (error: any) {
    console.error(`❌ PUT /api/projects/${id} error:`, error)
    
    // Check if this is a connection-related error and attempt recovery
    if (error instanceof Error && 
        (error.message.includes('prepared statement') || 
         error.message.includes('connection') || 
         error.message.includes('ConnectionError'))) {
      console.log('🔄 Connection error detected, attempting recovery...')
      await recoverPrismaConnection()
    }
    
    if (error.message.includes('Authentication') || error.message.includes('not found in database')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(createApiError('Failed to update project'), { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log(`📋 DELETE /api/projects/${id} - Deleting project`)
  
  try {
    // Validate connection health before starting
    const connectionHealthy = await validatePrismaConnection()
    if (!connectionHealthy) {
      console.log('⚠️ Connection unhealthy, attempting recovery...')
      const recovered = await recoverPrismaConnection()
      if (!recovered) {
        return NextResponse.json(createApiError(
          'Database connection issue - please try again in a moment'
        ), { status: 503 })
      }
    }

    const { user, organization } = await authenticateRequest(request)
    
    // Verify project exists and belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organizationId: organization.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            deliverables: true
          }
        }
      }
    })
    
    if (!project) {
      return NextResponse.json(createApiError('Project not found'), { status: 404 })
    }
    
    // Check if project has deliverables
    if (project._count.deliverables > 0) {
      return NextResponse.json(createApiError(
        'Cannot delete project with existing deliverables. Please delete or reassign all deliverables first.'
      ), { status: 400 })
    }
    
    // Delete project in transaction
    await prisma.$transaction(async (tx) => {
      await tx.project.delete({
        where: { id: id }
      })

      // Create activity log
      await tx.activityLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: 'project.deleted',
          resourceType: 'Project',
          resourceId: id,
          metadata: {
            projectName: project.name,
            clientName: project.client.name,
            deletedBy: user.name
          }
        }
      })
    })
    
    console.log(`✅ Deleted project: ${project.name}`)
    
    return NextResponse.json(createApiResponse({
      message: 'Project deleted successfully',
      deletedProject: {
        id: project.id,
        name: project.name,
        client: project.client.name
      }
    }))
    
  } catch (error: any) {
    console.error(`❌ DELETE /api/projects/${id} error:`, error)
    
    // Check if this is a connection-related error and attempt recovery
    if (error instanceof Error && 
        (error.message.includes('prepared statement') || 
         error.message.includes('connection') || 
         error.message.includes('ConnectionError'))) {
      console.log('🔄 Connection error detected, attempting recovery...')
      await recoverPrismaConnection()
    }
    
    if (error.message.includes('Authentication') || error.message.includes('not found in database')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(createApiError('Failed to delete project'), { status: 500 })
  }
} 