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

// POST /api/projects/[id]/milestones
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { dbUser, organizationId } = await authenticateRequest(request)
    const { id: projectId } = context.params
    const body = await request.json()
    const { name, description, startDate, dueDate, sortOrder } = body
    if (!name || !projectId) {
      return NextResponse.json(createApiError('Name and projectId are required'), { status: 400 })
    }
    // Validate project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId }
    })
    if (!project) {
      return NextResponse.json(createApiError('Project not found or not accessible'), { status: 404 })
    }
    // Create milestone
    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0
      }
    })
    return NextResponse.json(createApiResponse(milestone, 'Milestone created'), { status: 201 })
  } catch (error) {
    console.error('POST /api/projects/[id]/milestones error:', error)
    return NextResponse.json(createApiError('Failed to create milestone'), { status: 500 })
  }
} 