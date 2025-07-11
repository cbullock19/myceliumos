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

// PATCH /api/milestones/reorder
export async function PATCH(request: NextRequest) {
  try {
    const { dbUser, organizationId } = await authenticateRequest(request)
    const body = await request.json()
    const { milestones } = body // [{id, sortOrder}]
    if (!Array.isArray(milestones)) {
      return NextResponse.json(createApiError('Milestones array required'), { status: 400 })
    }
    // Validate all milestones belong to user's org
    const ids = milestones.map(m => m.id)
    const found = await prisma.projectMilestone.findMany({
      where: { id: { in: ids }, project: { organizationId } },
      select: { id: true }
    })
    if (found.length !== milestones.length) {
      return NextResponse.json(createApiError('One or more milestones not found or not accessible'), { status: 403 })
    }
    // Update all in a transaction
    await prisma.$transaction(
      milestones.map(m =>
        prisma.projectMilestone.update({ where: { id: m.id }, data: { sortOrder: m.sortOrder } })
      )
    )
    return NextResponse.json(createApiResponse({}, 'Milestones reordered'))
  } catch (error) {
    console.error('PATCH /api/milestones/reorder error:', error)
    return NextResponse.json(createApiError('Failed to reorder milestones'), { status: 500 })
  }
} 