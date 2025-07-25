import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(createApiError('Not authenticated', 401), { status: 401 })
    }

    const { id: clientId } = await params

    // Verify the client exists and belongs to the user's organization
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    })

    if (!adminUser || !adminUser.organizationId) {
      return NextResponse.json(createApiError('Organization access required', 403), { status: 403 })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: adminUser.organizationId
      }
    })

    if (!client) {
      return NextResponse.json(createApiError('Client not found', 404), { status: 404 })
    }

    // Fetch client users
    const clientUsers = await prisma.clientUser.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        canApprove: true,
        canDownload: true,
        canComment: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(createApiResponse({
      clientUsers,
      total: clientUsers.length
    }))

  } catch (error) {
    console.error('Error fetching client users:', error)
    return NextResponse.json(createApiError('Failed to fetch client users'), { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(createApiError('Not authenticated', 401), { status: 401 })
    }

    const { id: clientId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(createApiError('User ID required', 400), { status: 400 })
    }

    // Verify the client exists and belongs to the user's organization
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    })

    if (!adminUser || !adminUser.organizationId) {
      return NextResponse.json(createApiError('Organization access required', 403), { status: 403 })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: adminUser.organizationId
      }
    })

    if (!client) {
      return NextResponse.json(createApiError('Client not found', 404), { status: 404 })
    }

    // Delete the client user
    await prisma.clientUser.delete({
      where: {
        id: userId,
        clientId
      }
    })

    return NextResponse.json(createApiResponse({
      message: 'Client user deleted successfully'
    }))

  } catch (error) {
    console.error('Error deleting client user:', error)
    return NextResponse.json(createApiError('Failed to delete client user'), { status: 500 })
  }
} 