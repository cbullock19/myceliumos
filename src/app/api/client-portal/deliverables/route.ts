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
    const serviceTypeId = searchParams.get('serviceTypeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      clientId: clientUser.clientId
    }

    if (status && status !== 'all') {
      where.status = status as DeliverableStatus
    }

    if (serviceTypeId) {
      where.serviceTypeId = serviceTypeId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get deliverables with pagination
    const [deliverables, total] = await Promise.all([
      prisma.deliverable.findMany({
        where,
        include: {
          serviceType: {
            select: { id: true, name: true, slug: true, color: true }
          },
          assignedUser: {
            select: { id: true, name: true, avatarUrl: true }
          },
          client: {
            select: { id: true, name: true, slug: true }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { dueDate: 'asc' as const },
          { createdAt: 'desc' as const }
        ],
        skip,
        take: limit
      }),
      prisma.deliverable.count({ where })
    ])

    // Get status counts for filters
    const statusCounts = await prisma.deliverable.groupBy({
      by: ['status'],
      where: { clientId: clientUser.clientId },
      _count: { id: true }
    })

    const statusCountsMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json(createApiResponse({
      deliverables,
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
    console.error('Client portal deliverables error:', error)
    return NextResponse.json(createApiError('Failed to load deliverables'), { status: 500 })
  }
} 