import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError } from '@/lib/utils'

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

// GET /api/dashboard - Get dashboard overview data
export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/dashboard - Fetching dashboard data')
    
    const { dbUser, organizationId } = await authenticateRequest(request)
    const isAdmin = dbUser.role === 'ADMIN'

    // Base query filters
    const userFilter = isAdmin ? {} : { assignedUserId: dbUser.id }
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

    // Get today's tasks
    const todaysTasks = await prisma.deliverable.findMany({
      where: {
        organizationId,
        ...userFilter,
        dueDate: {
          gte: startOfToday,
          lt: endOfToday
        },
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        client: {
          select: { id: true, name: true, slug: true }
        },
        serviceType: {
          select: { id: true, name: true, slug: true, color: true }
        },
        assignedUser: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    })

    // Get overdue tasks
    const overdueTasks = await prisma.deliverable.findMany({
      where: {
        organizationId,
        ...userFilter,
        dueDate: { lt: startOfToday },
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        client: {
          select: { id: true, name: true, slug: true }
        },
        serviceType: {
          select: { id: true, name: true, slug: true, color: true }
        },
        assignedUser: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    })

    // Get upcoming tasks (next 7 days)
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingTasks = await prisma.deliverable.findMany({
      where: {
        organizationId,
        ...userFilter,
        dueDate: {
          gt: endOfToday,
          lte: nextWeek
        },
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        client: {
          select: { id: true, name: true, slug: true }
        },
        serviceType: {
          select: { id: true, name: true, slug: true, color: true }
        },
        assignedUser: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    })

    // Get recently completed tasks
    const recentlyCompleted = await prisma.deliverable.findMany({
      where: {
        organizationId,
        ...userFilter,
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        client: {
          select: { id: true, name: true, slug: true }
        },
        serviceType: {
          select: { id: true, name: true, slug: true, color: true }
        },
        completedBy: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: 5
    })

    // Get task counts
    const taskCounts = await prisma.deliverable.groupBy({
      by: ['status'],
      where: {
        organizationId,
        ...userFilter
      },
      _count: {
        id: true
      }
    })

    // Convert to object for easier access
    const statusCounts = taskCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Get recent activity (admin only)
    let recentActivity = []
    if (isAdmin) {
      recentActivity = await prisma.activityLog.findMany({
        where: {
          organizationId,
          action: { in: ['deliverable.created', 'deliverable.completed', 'client.created', 'user.invited'] }
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true }
          }
        }
      })
    }

    // Get team stats (admin only)
    let teamStats = null
    if (isAdmin) {
      const [totalClients, totalUsers, totalServiceTypes] = await Promise.all([
        prisma.client.count({ where: { organizationId } }),
        prisma.user.count({ where: { organizationId } }),
        prisma.serviceType.count({ where: { organizationId, isActive: true } })
      ])

      teamStats = {
        totalClients,
        totalUsers,
        totalServiceTypes,
        totalTasks: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      }
    }

    const dashboardData = {
      todaysTasks,
      overdueTasks,
      upcomingTasks,
      recentlyCompleted,
      statusCounts: {
        pending: statusCounts.PENDING || 0,
        inProgress: statusCounts.IN_PROGRESS || 0,
        needsReview: statusCounts.NEEDS_REVIEW || 0,
        completed: statusCounts.COMPLETED || 0,
        overdue: overdueTasks.length
      },
      recentActivity,
      teamStats,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl
      }
    }

    console.log(`✅ Dashboard data prepared for ${dbUser.name}`)

    return NextResponse.json(createApiResponse(dashboardData))

  } catch (error) {
    console.error('❌ GET /api/dashboard error:', error)
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(createApiError(error.message), { status: 401 })
    }
    
    return NextResponse.json(
      createApiError('Failed to fetch dashboard data'),
      { status: 500 }
    )
  }
} 