import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase'
import { createApiResponse, createApiError } from '@/lib/utils'

async function authenticateRequest(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Authentication required')
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, include: { organization: true } })
  if (!dbUser || !dbUser.organization) throw new Error('User not found in database')
  return { user, dbUser, organizationId: dbUser.organizationId }
}

// PUT /api/milestones/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { dbUser, organizationId } = await authenticateRequest(request)
    const { id: milestoneId } = params
    const body = await request.json()
    const { name, description, startDate, dueDate, status, sortOrder } = body
    // Validate milestone ownership
    const milestone = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, project: { organizationId } }
    })
    if (!milestone) {
      return NextResponse.json(createApiError('Milestone not found or not accessible'), { status: 404 })
    }
    // Update milestone
    const updated = await prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        sortOrder
      }
    })
    return NextResponse.json(createApiResponse(updated, 'Milestone updated'))
  } catch (error) {
    console.error('PUT /api/milestones/[id] error:', error)
    return NextResponse.json(createApiError('Failed to update milestone'), { status: 500 })
  }
}

// DELETE /api/milestones/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { dbUser, organizationId } = await authenticateRequest(request)
    const { id: milestoneId } = params
    // Validate milestone ownership
    const milestone = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, project: { organizationId } }
    })
    if (!milestone) {
      return NextResponse.json(createApiError('Milestone not found or not accessible'), { status: 404 })
    }
    await prisma.projectMilestone.delete({ where: { id: milestoneId } })
    return NextResponse.json(createApiResponse({}, 'Milestone deleted'))
  } catch (error) {
    console.error('DELETE /api/milestones/[id] error:', error)
    return NextResponse.json(createApiError('Failed to delete milestone'), { status: 500 })
  }
} 