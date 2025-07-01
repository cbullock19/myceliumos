import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper function to authenticate requests
async function authenticateRequest(request: NextRequest) {
  console.log('🔐 Starting authentication process...')
  
  const authHeader = request.headers.get('Authorization')
  console.log('🔐 Authorization header present:', !!authHeader)
  
  if (!authHeader) {
    console.error('❌ No Authorization header found')
    throw new Error('Missing Authorization header')
  }
  
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    console.error('❌ Invalid Authorization header format:', authHeader.substring(0, 20) + '...')
    throw new Error('Invalid Authorization header format - must start with "Bearer "')
  }

  const token = authHeader.split(' ')[1]?.trim()
  console.log('🔐 Token extracted, length:', token?.length || 0)
  
  if (!token) {
    console.error('❌ No token found in Authorization header')
    throw new Error('No token found in Authorization header')
  }
  
  console.log('🔐 Verifying token with Supabase...')
  const supabase = createSupabaseClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError) {
      console.error('❌ Supabase auth error:', authError)
      throw new Error(`Token verification failed: ${authError.message}`)
    }

    if (!user) {
      console.error('❌ No user returned from Supabase')
      throw new Error('Invalid token - no user found')
    }

    console.log('✅ Supabase user authenticated:', {
      id: user.id,
      email: user.email
    })

    // Get the user's organization from Prisma database
    console.log('🔍 Looking up user in database...')
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    })

    if (!dbUser) {
      console.error('❌ User not found in database:', user.id)
      throw new Error('User not found in database - please complete onboarding')
    }

    if (!dbUser.organization) {
      console.error('❌ User has no organization:', user.id)
      throw new Error('User has no organization - please complete onboarding')
    }

    console.log('✅ User found in database with organization:', {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      organizationName: dbUser.organization.name,
      userRole: dbUser.role,
      userStatus: dbUser.status
    })

    // Check if user is active
    if (dbUser.status !== 'ACTIVE') {
      console.error('❌ User is not active:', dbUser.status)
      throw new Error(`User account is ${dbUser.status.toLowerCase()} - please contact support`)
    }

    return {
      user: dbUser,
      supabaseUser: user,
      organizationId: dbUser.organizationId,
      organization: dbUser.organization
    }
  } catch (supabaseError) {
    console.error('❌ Error during authentication:', supabaseError)
    if (supabaseError instanceof Error) {
      throw supabaseError
    }
    throw new Error(`Authentication failed: ${String(supabaseError)}`)
  }
}

// GET /api/clients - List organization's clients
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/clients - Fetching clients list')
    
    const { user: dbUser, organizationId } = await authenticateRequest(request)
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const serviceTypeId = searchParams.get('serviceTypeId')
    const status = searchParams.get('status')
    const serviceStatus = searchParams.get('serviceStatus') // NEW: Filter by service assignment status
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 Filter parameters:', { serviceTypeId, status, serviceStatus, limit, offset })

    // Build where clause
    const whereClause: any = {
      organizationId
    }

    // Filter by client status if provided
    if (status) {
      whereClause.status = status
    }

    // Filter by service type and/or service status if provided
    if (serviceTypeId || serviceStatus) {
      const assignmentFilter: any = {
        isActive: true
      }
      
      if (serviceTypeId) {
        assignmentFilter.serviceTypeId = serviceTypeId
      }
      
      if (serviceStatus) {
        assignmentFilter.status = serviceStatus
      }

      whereClause.assignments = {
        some: assignmentFilter
      }
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            serviceType: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
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
          orderBy: { assignedAt: 'desc' }
        },
        _count: {
          select: {
            deliverables: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.client.count({
      where: whereClause
    })

    console.log(`✅ Found ${clients.length} clients for organization: ${dbUser.organizationId}`)

    return NextResponse.json(createApiResponse({
      clients,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + clients.length < totalCount
      }
    }))

  } catch (error) {
    console.error('❌ GET /api/clients error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to fetch clients'),
      { status: 500 }
    )
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/clients - Creating new client')
    
    const { user: dbUser, organizationId } = await authenticateRequest(request)
    const body = await request.json()

    const {
      name,
      companyName,
      contactEmail,
      contactPhone,
      notes,
      serviceTypeIds = []
    } = body

    // Validate required fields
    if (!name || !companyName || !contactEmail) {
      return NextResponse.json(
        createApiError('Name, company name, and contact email are required'),
        { status: 400 }
      )
    }

    if (!serviceTypeIds.length) {
      return NextResponse.json(
        createApiError('At least one service type is required'),
        { status: 400 }
      )
    }

    // Verify all service types belong to the organization
    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        id: { in: serviceTypeIds },
        organizationId
      }
    })

    if (serviceTypes.length !== serviceTypeIds.length) {
      return NextResponse.json(
        createApiError('One or more service types are invalid'),
        { status: 400 }
      )
    }

    const slug = generateSlug(name)

    // Check if client with this name already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        organizationId,
        slug
      }
    })

    if (existingClient) {
      return NextResponse.json(
        createApiError('A client with this name already exists'),
        { status: 409 }
      )
    }

    // Create client and assignments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the client
      const client = await tx.client.create({
        data: {
          name,
          companyName,
          contactEmail,
          contactPhone: contactPhone || null,
          notes: notes || null,
          slug,
          organizationId,
          status: 'ACTIVE'
        }
      })

      // Create client assignments for each service type
      const assignments = await Promise.all(
        serviceTypeIds.map((serviceTypeId: string) =>
          tx.clientAssignment.create({
            data: {
              clientId: client.id,
              userId: dbUser.id, // Assign to the creator by default
              serviceTypeId,
              role: 'PRIMARY',
              isActive: true,
              assignedBy: dbUser.id
            },
            include: {
              serviceType: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          })
        )
      )

      return { client, assignments }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: dbUser.id,
        action: 'client.created',
        resourceType: 'Client',
        resourceId: result.client.id,
        metadata: {
          clientName: name,
          companyName,
          serviceTypes: serviceTypes.map(st => st.name),
          createdBy: dbUser.name
        }
      }
    })

    console.log(`✅ Created client: ${name} with ${serviceTypeIds.length} service assignments`)

    // Return client with assignments
    const clientWithAssignments = {
      ...result.client,
      assignments: result.assignments
    }

    return NextResponse.json(
      createApiResponse(clientWithAssignments, 'Client created successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ POST /api/clients error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to create client'),
      { status: 500 }
    )
  }
} 