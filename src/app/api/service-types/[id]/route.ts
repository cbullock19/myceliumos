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

// PUT /api/service-types/[id] - Update service type (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    console.log(`🔧 PUT /api/service-types/${id} - Updating service type`)
    
    const { dbUser, organizationId } = await authenticateRequest(request)

    // Only admins can update service types
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        createApiError('Only administrators can update service types'),
        { status: 403 }
      )
    }

    // Check if service type exists and belongs to organization
    const existingServiceType = await prisma.serviceType.findFirst({
      where: {
        id: id,
        organizationId
      },
      include: {
        deliverableFields: true
      }
    })

    if (!existingServiceType) {
      return NextResponse.json(
        createApiError('Service type not found'),
        { status: 404 }
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

    // Check if another service type with this name already exists
    const conflictingServiceType = await prisma.serviceType.findFirst({
      where: {
        organizationId,
        slug,
        id: {
          not: id
        }
      }
    })

    if (conflictingServiceType) {
      return NextResponse.json(
        createApiError('A service type with this name already exists'),
        { status: 409 }
      )
    }

    // Update the service type with deliverable fields
    const serviceType = await prisma.serviceType.update({
      where: { id: id },
      data: {
        name,
        slug,
        description,
        workflowType,
        defaultDuration,
        defaultRate: defaultRate ? parseFloat(defaultRate) : null,
        billingCycle,
        color,
        deliverableFields: {
          // Delete existing fields and create new ones
          deleteMany: {},
          create: deliverableFields.map((field: any, index: number) => ({
            name: field.name,
            slug: generateOrganizationSlug(field.name),
            type: field.type,
            isRequired: field.isRequired || false,
            sortOrder: index,
            defaultValue: field.defaultValue,
            placeholder: field.placeholder || '',
            helpText: field.helpText || '',
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
        action: 'service_type.updated',
        resourceType: 'ServiceType',
        resourceId: serviceType.id,
        metadata: {
          serviceTypeName: name,
          fieldsCount: deliverableFields.length,
          workflowType,
          previousName: existingServiceType.name
        }
      }
    })

    console.log(`✅ Updated service type: ${name}`)

    return NextResponse.json(
      createApiResponse(serviceType, 'Service type updated successfully')
    )

  } catch (error) {
    console.error(`❌ PUT /api/service-types/${id} error:`, error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to update service type'),
      { status: 500 }
    )
  }
}

// DELETE /api/service-types/[id] - Delete service type (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    console.log(`🔧 DELETE /api/service-types/${id} - Deleting service type`)
    
    const { dbUser, organizationId } = await authenticateRequest(request)

    // Only admins can delete service types
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        createApiError('Only administrators can delete service types'),
        { status: 403 }
      )
    }

    // Check if service type exists and belongs to organization
    const existingServiceType = await prisma.serviceType.findFirst({
      where: {
        id: id,
        organizationId
      }
    })

    if (!existingServiceType) {
      return NextResponse.json(
        createApiError('Service type not found'),
        { status: 404 }
      )
    }

    // Check if service type is in use
    const usageCount = await prisma.serviceType.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            deliverables: true,
            clientAssignments: true
          }
        }
      }
    })

    if (usageCount && (usageCount._count.deliverables > 0 || usageCount._count.clientAssignments > 0)) {
      // Soft delete instead of hard delete
      await prisma.serviceType.update({
        where: { id: id },
        data: { isActive: false }
      })

      console.log(`✅ Soft deleted service type: ${existingServiceType.name}`)

      return NextResponse.json(
        createApiResponse(null, 'Service type deactivated successfully (it was in use)')
      )
    } else {
      // Hard delete if not in use
      await prisma.serviceType.delete({
        where: { id: id }
      })

      console.log(`✅ Hard deleted service type: ${existingServiceType.name}`)
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: dbUser.id,
        action: 'service_type.deleted',
        resourceType: 'ServiceType',
        resourceId: id,
        metadata: {
          serviceTypeName: existingServiceType.name
        }
      }
    })

    return NextResponse.json(
      createApiResponse(null, 'Service type deleted successfully')
    )

  } catch (error) {
    console.error(`❌ DELETE /api/service-types/${id} error:`, error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to delete service type'),
      { status: 500 }
    )
  }
} 