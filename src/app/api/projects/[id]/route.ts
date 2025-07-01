import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
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

// GET /api/projects/[id] - Fetch project details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log(`📋 GET /api/projects/${id} - Fetching project details`)
  
  try {
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
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Found project: ${project.name} with ${project._count.deliverables} deliverables`)
    
    return NextResponse.json({
      success: true,
      data: project
    })
    
  } catch (error: any) {
    console.error(`❌ GET /api/projects/${id} error:`, error)
    
    if (error.message.includes('Authorization') || error.message.includes('token') || error.message.includes('User not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log(`📋 PUT /api/projects/${id} - Updating project`)
  
  try {
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
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
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
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }
    }
    
    // Update project
    const project = await prisma.project.update({
      where: { id: id },
      data: {
        name: body.name || existingProject.name,
        description: body.description,
        status: body.status || existingProject.status,
        priority: body.priority || existingProject.priority,
        startDate: body.startDate ? new Date(body.startDate) : existingProject.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existingProject.endDate,
        estimatedHours: body.estimatedHours ? parseFloat(body.estimatedHours) : existingProject.estimatedHours,
        budgetAmount: body.budgetAmount ? parseFloat(body.budgetAmount) : existingProject.budgetAmount,
        currency: body.currency || existingProject.currency,
        managerId: body.managerId || existingProject.managerId
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
    
    console.log(`✅ Updated project: ${project.name}`)
    
    return NextResponse.json({
      success: true,
      data: project
    })
    
  } catch (error: any) {
    console.error(`❌ PUT /api/projects/${id} error:`, error)
    
    if (error.message.includes('Authorization') || error.message.includes('token') || error.message.includes('User not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log(`📋 DELETE /api/projects/${id} - Deleting project`)
  
  try {
    const { user, organization } = await authenticateRequest(request)
    
    // Verify project exists and belongs to organization
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        organizationId: organization.id
      },
      include: {
        _count: {
          select: {
            deliverables: true
          }
        }
      }
    })
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Check if project has deliverables
    if (existingProject._count.deliverables > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with existing deliverables. Please move or delete all deliverables first.' },
        { status: 400 }
      )
    }
    
    // Delete project
    await prisma.project.delete({
      where: { id: id }
    })
    
    console.log(`✅ Deleted project: ${existingProject.name}`)
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })
    
  } catch (error: any) {
    console.error(`❌ DELETE /api/projects/${id} error:`, error)
    
    if (error.message.includes('Authorization') || error.message.includes('token') || error.message.includes('User not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
} 