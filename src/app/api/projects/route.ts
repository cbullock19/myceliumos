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

// GET /api/projects - Fetch projects list with stats
export async function GET(request: NextRequest) {
  console.log('📋 GET /api/projects - Fetching projects list')
  
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
    
    const url = new URL(request.url)
    const clientId = url.searchParams.get('clientId')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    console.log('🔍 Filter parameters:', {
      clientId,
      status,
      limit,
      offset
    })
    
    // Build where clause
    const whereClause: any = {
      organizationId: organization.id
    }
    
    if (clientId) {
      whereClause.clientId = clientId
    }
    
    if (status) {
      whereClause.status = status
    }
    
    // Fetch projects with related data
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        deliverables: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedUser: {
              select: {
                id: true,
                name: true
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
      },
      orderBy: [
        { status: 'asc' },
        { startDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })
    
    // Get total count for pagination
    const totalCount = await prisma.project.count({
      where: whereClause
    })
    
    console.log(`✅ Found ${projects.length} projects for organization: ${organization.name}`)
    
    return NextResponse.json(createApiResponse({
      projects,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    }))
    
  } catch (error: any) {
    console.error('❌ GET /api/projects error:', error)
    
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
    
    return NextResponse.json(createApiError('Failed to fetch projects'), { status: 500 })
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  console.log('📋 POST /api/projects - Creating new project')
  
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
    console.log('📋 Project creation data:', body)
    
    // Validate required fields
    if (!body.name || !body.clientId) {
      return NextResponse.json(createApiError(
        'Project name and client are required'
      ), { status: 400 })
    }
    
    // Verify client exists and belongs to organization
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
    
    // Create project in transaction
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name: body.name,
          description: body.description || null,
          clientId: body.clientId,
          organizationId: organization.id,
          status: body.status || 'ACTIVE',
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          budgetAmount: body.budget ? parseFloat(body.budget) : null,
          managerId: user.id
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
          action: 'project.created',
          resourceType: 'Project',
          resourceId: newProject.id,
          metadata: {
            projectName: newProject.name,
            clientName: client.name,
            createdBy: user.name
          }
        }
      })

      return newProject
    })
    
    console.log(`✅ Created project: ${project.name} for client: ${client.name}`)
    
    return NextResponse.json(createApiResponse(project, 'Project created successfully'), { status: 201 })
    
  } catch (error: any) {
    console.error('❌ POST /api/projects error:', error)
    
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
    
    return NextResponse.json(createApiError('Failed to create project'), { status: 500 })
  }
} 