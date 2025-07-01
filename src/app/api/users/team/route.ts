import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

  return { user, dbUser }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/users/team - Fetching team members')
    
    const { user, dbUser } = await authenticateRequest(request)
    console.log('✅ Request authenticated for org:', dbUser.organization.name)

    // All authenticated users can view team members
    // (Admin permissions are checked for editing operations in other endpoints)

    // Fetch all team members for the organization
    const teamMembers = await prisma.user.findMany({
      where: {
        organizationId: dbUser.organizationId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        title: true,
        avatarUrl: true,
        lastLoginAt: true,
        emailVerified: true,
        invitedAt: true,
        invitedBy: true,
        createdAt: true,
        // Count assigned clients
        assignedClients: {
          select: {
            id: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Active users first
        { createdAt: 'desc' } // Newest first within each status
      ]
    })

    // Transform data to include client count and format for frontend
    const formattedMembers = teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      title: member.title,
      avatarUrl: member.avatarUrl,
      lastLoginAt: member.lastLoginAt?.toISOString(),
      emailVerified: member.emailVerified,
      assignedClientsCount: member.assignedClients.length,
      invitedAt: member.invitedAt?.toISOString(),
      invitedBy: member.invitedBy,
      createdAt: member.createdAt.toISOString()
    }))

    console.log(`✅ Retrieved ${formattedMembers.length} team members`)

    return NextResponse.json({
      users: formattedMembers,
      organization: {
        id: dbUser.organization.id,
        name: dbUser.organization.name
      }
    })

  } catch (error) {
    console.error('❌ GET /api/users/team error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.message.includes('not found in database')) {
        return NextResponse.json({ error: 'User not found - please complete onboarding' }, { status: 401 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 