import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProjectStatus } from '@prisma/client'
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

    // Get client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: decoded.clientUserId }
    })

    if (!clientUser || !clientUser.isActive) {
      return NextResponse.json(createApiError('User not found or inactive', 404), { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      clientId: clientUser.clientId
    }

    if (status && status !== 'all') {
      where.status = status as ProjectStatus
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get projects with pagination
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          manager: {
            select: { id: true, name: true, avatarUrl: true }
          },
          client: {
            select: { id: true, name: true, slug: true }
          },
          deliverables: {
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
              completedAt: true
            },
            orderBy: { dueDate: 'asc' as const }
          },
          milestones: {
            select: {
              id: true,
              name: true,
              status: true,
              dueDate: true,
              completedAt: true
            },
            orderBy: { dueDate: 'asc' as const }
          },
          _count: {
            select: {
              deliverables: true,
              milestones: true
            }
          }
        },
        orderBy: [
          { startDate: 'desc' as const },
          { createdAt: 'desc' as const }
        ],
        skip,
        take: limit
      }),
      prisma.project.count({ where })
    ])

    // Get status counts for filters
    const statusCounts = await prisma.project.groupBy({
      by: ['status'],
      where: { clientId: clientUser.clientId },
      _count: { id: true }
    })

    const statusCountsMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json(createApiResponse({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        statusCounts: statusCountsMap
      }
    }))

  } catch (error) {
    console.error('Client portal projects error:', error)
    return NextResponse.json(createApiError('Failed to load projects'), { status: 500 })
  }
} 