import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Authentication helper
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader) {
    console.error('❌ No Authorization header found')
    throw new Error('Missing Authorization header')
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.error('❌ Invalid Authorization header format')
    throw new Error('Invalid Authorization header format')
  }
  
  const token = authHeader.substring(7)
  
  try {
    console.log('🔐 Verifying token with Supabase...')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('❌ Invalid token:', error?.message)
      throw new Error('Invalid or expired token')
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
      throw new Error('User not found')
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
  } catch (error) {
    console.error('❌ Authentication error:', error)
    throw error
  }
}

// GET /api/projects - Fetch projects list with stats
export async function GET(request: NextRequest) {
  console.log('📋 GET /api/projects - Fetching projects list')
  
  try {
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
    
    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
    
  } catch (error: any) {
    console.error('❌ GET /api/projects error:', error)
    
    if (error.message.includes('Authorization') || error.message.includes('token') || error.message.includes('User not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  console.log('📋 POST /api/projects - Creating new project')
  
  try {
    const { user, organization } = await authenticateRequest(request)
    
    const body = await request.json()
    console.log('📋 Project creation data:', body)
    
    // Validate required fields
    if (!body.name || !body.clientId) {
      return NextResponse.json(
        { error: 'Project name and client are required' },
        { status: 400 }
      )
    }
    
    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: body.clientId,
        organizationId: organization.id
      }
    })
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    // Create project
    const project = await prisma.project.create({
      data: {
        organizationId: organization.id,
        clientId: body.clientId,
        name: body.name,
        description: body.description,
        status: body.status || 'PLANNING',
        priority: body.priority || 'MEDIUM',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        estimatedHours: body.estimatedHours ? parseFloat(body.estimatedHours) : null,
        budgetAmount: body.budgetAmount ? parseFloat(body.budgetAmount) : null,
        currency: body.currency || 'USD',
        managerId: body.managerId || user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            deliverables: true
          }
        }
      }
    })
    
    console.log(`✅ Created project: ${project.name} for client ${client.name}`)
    
    return NextResponse.json({
      success: true,
      data: project
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('❌ POST /api/projects error:', error)
    
    if (error.message.includes('Authorization') || error.message.includes('token') || error.message.includes('User not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
} 