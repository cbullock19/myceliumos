import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DeliverableStatus } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('client-auth-token')?.value

    if (!token) {
      return NextResponse.json(createApiError('Not authenticated', 401), { status: 401 })
    }

    // Verify the token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json(createApiError('Invalid token', 401), { status: 401 })
    }

    // Get client user with permissions
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: decoded.clientUserId },
      include: {
        client: {
          include: {
            organization: {
              include: {
                branding: true
              }
            }
          }
        }
      }
    })

    if (!clientUser || !clientUser.isActive) {
      return NextResponse.json(createApiError('User not found or inactive', 404), { status: 404 })
    }

    const clientId = clientUser.clientId
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

    // Get deliverables based on permissions
    const deliverablesQuery = {
      where: {
        clientId,
        status: { in: [DeliverableStatus.PENDING, DeliverableStatus.IN_PROGRESS, DeliverableStatus.NEEDS_REVIEW, DeliverableStatus.COMPLETED] }
      },
      include: {
        serviceType: {
          select: { id: true, name: true, slug: true, color: true }
        },
        assignedUser: {
          select: { id: true, name: true, avatarUrl: true }
        },
        client: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { dueDate: 'asc' as const }
    }

    // Get recent deliverables (last 30 days)
    const recentDeliverables = await prisma.deliverable.findMany({
      ...deliverablesQuery,
      where: {
        ...deliverablesQuery.where,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      take: 10
    })

    // Get pending approvals (if user can approve)
    let pendingApprovals: any[] = []
    if (clientUser.canApprove) {
      pendingApprovals = await prisma.deliverable.findMany({
        ...deliverablesQuery,
        where: {
          ...deliverablesQuery.where,
          status: DeliverableStatus.NEEDS_REVIEW
        },
        take: 5
      })
    }

    // Get today's deliverables
    const todaysDeliverables = await prisma.deliverable.findMany({
      ...deliverablesQuery,
      where: {
        ...deliverablesQuery.where,
        dueDate: {
          gte: startOfToday,
          lt: endOfToday
        }
      }
    })

    // Get overdue deliverables
    const overdueDeliverables = await prisma.deliverable.findMany({
      ...deliverablesQuery,
      where: {
        ...deliverablesQuery.where,
        dueDate: { lt: startOfToday },
        status: { in: [DeliverableStatus.PENDING, DeliverableStatus.IN_PROGRESS] }
      }
    })

    // Get upcoming deliverables (next 7 days)
    const upcomingDeliverables = await prisma.deliverable.findMany({
      ...deliverablesQuery,
      where: {
        ...deliverablesQuery.where,
        dueDate: {
          gte: endOfToday,
          lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: 5
    })

    // Get stats
    const [totalDeliverables, completedThisMonth, overdueCount, pendingApprovalsCount] = await Promise.all([
      prisma.deliverable.count({
        where: { clientId, status: { in: [DeliverableStatus.PENDING, DeliverableStatus.IN_PROGRESS, DeliverableStatus.NEEDS_REVIEW, DeliverableStatus.COMPLETED] } }
      }),
      prisma.deliverable.count({
        where: {
          clientId,
          status: DeliverableStatus.COMPLETED,
          completedAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1) // Start of current month
          }
        }
      }),
      prisma.deliverable.count({
        where: {
          clientId,
          dueDate: { lt: startOfToday },
          status: { in: [DeliverableStatus.PENDING, DeliverableStatus.IN_PROGRESS] }
        }
      }),
      clientUser.canApprove ? prisma.deliverable.count({
        where: { clientId, status: DeliverableStatus.NEEDS_REVIEW }
      }) : Promise.resolve(0)
    ])

    // Get file access summary (placeholder for now)
    const fileAccessSummary = {
      totalFiles: 0, // TODO: Implement file system
      recentDownloads: 0,
      pendingUploads: 0
    }

    const dashboardData = {
      recentDeliverables,
      pendingApprovals,
      todaysDeliverables,
      overdueDeliverables,
      upcomingDeliverables,
      fileAccessSummary,
      stats: {
        totalDeliverables,
        completedThisMonth,
        overdue: overdueCount,
        pendingApprovals: pendingApprovalsCount
      },
      client: {
        id: clientUser.client.id,
        name: clientUser.client.name,
        slug: clientUser.client.slug
      },
      organization: {
        id: clientUser.client.organization.id,
        name: clientUser.client.organization.name,
        branding: clientUser.client.organization.branding
      },
      user: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: clientUser.role,
        permissions: {
          canApprove: clientUser.canApprove,
          canDownload: clientUser.canDownload,
          canComment: clientUser.canComment
        }
      }
    }

    return NextResponse.json(createApiResponse(dashboardData))

  } catch (error) {
    console.error('Client portal dashboard error:', error)
    return NextResponse.json(createApiError('Failed to load dashboard data'), { status: 500 })
  }
} 