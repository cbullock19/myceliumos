import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError, generateOrganizationSlug } from '@/lib/utils'

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

// GET /api/service-types - List organization's service types
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 GET /api/service-types - Fetching service types')
    
    const { organizationId } = await authenticateRequest(request)

    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        deliverableFields: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            deliverables: true,
            clientAssignments: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    console.log(`✅ Found ${serviceTypes.length} service types`)

    return NextResponse.json(createApiResponse(serviceTypes))

  } catch (error) {
    console.error('❌ GET /api/service-types error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to fetch service types'),
      { status: 500 }
    )
  }
}

// POST /api/service-types - Create new service type (admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST /api/service-types - Creating new service type')
    
    const { dbUser, organizationId } = await authenticateRequest(request)

    // Only admins can create service types
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        createApiError('Only administrators can create service types'),
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      workflowType = 'PROJECT',
      defaultDuration = 7,
      defaultRate,
      billingCycle,
      color = '#10B981',
      deliverableFields = []
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        createApiError('Service type name is required'),
        { status: 400 }
      )
    }

    const slug = generateOrganizationSlug(name)

    // Check if service type with this name already exists
    const existingServiceType = await prisma.serviceType.findFirst({
      where: {
        organizationId,
        slug
      }
    })

    if (existingServiceType) {
      return NextResponse.json(
        createApiError('A service type with this name already exists'),
        { status: 409 }
      )
    }

    // Get the next sort order
    const lastServiceType = await prisma.serviceType.findFirst({
      where: { organizationId },
      orderBy: { sortOrder: 'desc' }
    })
    const sortOrder = (lastServiceType?.sortOrder || 0) + 1

    // Create the service type with deliverable fields
    const serviceType = await prisma.serviceType.create({
      data: {
        organizationId,
        name,
        slug,
        description,
        workflowType,
        defaultDuration,
        defaultRate: defaultRate ? parseFloat(defaultRate) : null,
        billingCycle,
        color,
        sortOrder,
        deliverableFields: {
          create: deliverableFields.map((field: any, index: number) => ({
            name: field.name,
            slug: generateOrganizationSlug(field.name),
            type: field.type,
            isRequired: field.isRequired || false,
            sortOrder: index,
            defaultValue: field.defaultValue,
            placeholder: field.placeholder,
            helpText: field.helpText,
            options: field.options ? JSON.stringify(field.options) : null,
            minLength: field.minLength,
            maxLength: field.maxLength,
            minValue: field.minValue ? parseFloat(field.minValue) : null,
            maxValue: field.maxValue ? parseFloat(field.maxValue) : null,
            pattern: field.pattern
          }))
        }
      },
      include: {
        deliverableFields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: dbUser.id,
        action: 'service_type.created',
        resourceType: 'ServiceType',
        resourceId: serviceType.id,
        metadata: {
          serviceTypeName: name,
          fieldsCount: deliverableFields.length,
          workflowType
        }
      }
    })

    console.log(`✅ Created service type: ${name}`)

    return NextResponse.json(
      createApiResponse(serviceType, 'Service type created successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ POST /api/service-types error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to create service type'),
      { status: 500 }
    )
  }
} 