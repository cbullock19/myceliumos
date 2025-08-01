import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
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
  const supabase = await createSupabaseServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get user profile to get organization ID
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true }
  })

  if (!userProfile?.organizationId) {
    throw new Error('User not associated with an organization')
  }

  return {
    user,
    organizationId: userProfile.organizationId
  }
}

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await authenticateRequest(request)

    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        assignments: {
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
        },
        _count: {
          select: {
            deliverables: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        createApiError('Client not found', 404),
        { status: 404 }
      )
    }

    return NextResponse.json(createApiResponse(client))
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error)
    
    if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('unauthorized'))) {
      return NextResponse.json(
        createApiError(error.message),
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      createApiError('Failed to fetch client'),
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Update a specific client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await authenticateRequest(request)

    const body = await request.json()
    const { name, companyName, contactEmail, contactPhone, notes, status } = body

    const updateData: any = {}
    
    if (name) {
      updateData.name = name
      updateData.slug = generateSlug(name)
    }
    if (companyName) updateData.companyName = companyName
    if (contactEmail) updateData.contactEmail = contactEmail
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null
    if (notes !== undefined) updateData.notes = notes || null
    if (status) updateData.status = status

    // Check if client exists and belongs to organization
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!existingClient) {
      return NextResponse.json(
        createApiError('Client not found', 404),
        { status: 404 }
      )
    }

    const client = await prisma.client.update({
      where: {
        id
      },
      data: updateData
    })

    // Log activity if status changed
    if (status && status !== existingClient.status) {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const dbUser = await prisma.user.findFirst({
          where: { email: user.email }
        })

        if (dbUser) {
          await prisma.activityLog.create({
            data: {
              organizationId,
              userId: dbUser.id,
              action: 'client.status_changed',
              resourceType: 'Client',
              resourceId: id,
              metadata: {
                clientName: existingClient.name,
                oldStatus: existingClient.status,
                newStatus: status,
                updatedBy: dbUser.name
              }
            }
          })
        }
      }
    }

    return NextResponse.json(createApiResponse(client, 'Client updated successfully'))
  } catch (error) {
    console.error('PUT /api/clients/[id] error:', error)
    
    if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('unauthorized'))) {
      return NextResponse.json(
        createApiError(error.message),
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      createApiError('Failed to update client'),
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Delete a specific client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await authenticateRequest(request)

    // Check if client exists and belongs to organization
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!existingClient) {
      return NextResponse.json(
        createApiError('Client not found', 404),
        { status: 404 }
      )
    }

    await prisma.client.delete({
      where: {
        id
      }
    })

    return NextResponse.json(createApiResponse(null, 'Client deleted successfully'))
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error)
    
    if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('unauthorized'))) {
      return NextResponse.json(
        createApiError(error.message),
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      createApiError('Failed to delete client'),
      { status: 500 }
    )
  }
} 