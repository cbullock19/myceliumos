import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'
import { prisma, validatePrismaConnection, recoverPrismaConnection } from '@/lib/prisma'

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    console.log(`🗑️  DELETE /api/users/${userId} - Attempting user deletion`)
    
    // Validate connection health before starting complex operations
    const connectionHealthy = await validatePrismaConnection()
    if (!connectionHealthy) {
      console.log('⚠️ Connection unhealthy, attempting recovery...')
      const recovered = await recoverPrismaConnection()
      if (!recovered) {
        return NextResponse.json({
          error: 'Database connection issue',
          details: 'Please try again in a moment',
          resolution: 'The system is recovering from a temporary connection issue'
        }, { status: 503 })
      }
    }
    
    const { user: currentUser, dbUser: currentDbUser } = await authenticateRequest(request)
    console.log('✅ Request authenticated for org:', currentDbUser.organization.name)

    // ADMIN-ONLY PERMISSION CHECK
    if (currentDbUser.role !== 'ADMIN') {
      console.log('❌ Insufficient permissions for user deletion')
      return NextResponse.json(
        { error: 'Only administrators can delete team members' },
        { status: 403 }
      )
    }

    // Get the user to be deleted
    const targetUser = await prisma.user.findUnique({
      where: { 
        id: userId,
        organizationId: currentDbUser.organizationId // Ensure same organization
      },
      include: {
        assignedClients: {
          select: { 
            id: true,
            client: { select: { name: true } }
          }
        },
        // Get deliverables assigned to this user
        assignedDeliverables: {
          select: { 
            id: true, 
            title: true, 
            status: true,
            client: { select: { name: true } }
          },
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] } // Only active deliverables
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found or not in your organization' },
        { status: 404 }
      )
    }

    // SAFETY CHECK 1: Cannot delete self
    if (targetUser.id === currentDbUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // SAFETY CHECK 2: Cannot delete the only admin
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: currentDbUser.organizationId,
          role: 'ADMIN',
          status: { in: ['ACTIVE', 'PENDING'] }
        }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { 
            error: 'Cannot delete the only administrator in the organization',
            resolution: 'Promote another user to admin first, then retry deletion'
          },
          { status: 400 }
        )
      }
    }

    // Prepare impact analysis
    const impactAnalysis = {
      assignedClientsCount: targetUser.assignedClients.length,
      activeDeliverablesCount: targetUser.assignedDeliverables.length,
      assignedClients: targetUser.assignedClients.map(c => c.client.name),
      activeDeliverables: targetUser.assignedDeliverables.map(d => ({
        title: d.title,
        status: d.status,
        client: d.client.name
      }))
    }

    console.log('📊 Deletion impact analysis:', impactAnalysis)

    // Begin deletion process in transaction
    console.log('🔄 Starting deletion process with transaction...')

    // STEP 1: Handle Supabase Auth deletion first (outside transaction)
    console.log('🔐 Attempting to delete from Supabase Auth...')
    const supabaseAdmin = createSupabaseAdminClient()
    
    // Check if userId is in UUID format (newer users) or CUID format (legacy users)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
    
    if (isUUID) {
      // User has Supabase Auth account - delete it
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (authDeleteError) {
        console.error('❌ Failed to delete from Supabase Auth:', authDeleteError)
        throw new Error(`Failed to delete authentication account: ${authDeleteError.message}`)
      }
      
      console.log('✅ Supabase Auth user deleted successfully')
    } else {
      // Legacy user with CUID - no Supabase Auth account to delete
      console.log('ℹ️  Legacy user detected (CUID format) - skipping Supabase Auth deletion')
      console.log('   User ID:', userId, 'is not UUID format, likely created before current auth system')
    }

    // STEP 2: Database operations in single transaction
    const deletedUser = await prisma.$transaction(async (tx) => {
      // Reassign deliverables to admin
      if (targetUser.assignedDeliverables.length > 0) {
        console.log(`📋 Reassigning ${targetUser.assignedDeliverables.length} active deliverables to admin...`)
        
        await tx.deliverable.updateMany({
          where: {
            assignedUserId: userId,
            status: { in: ['PENDING', 'IN_PROGRESS'] }
          },
          data: {
            assignedUserId: currentDbUser.id // Reassign to current admin
          }
        })

        // Batch create comments for reassignment (much more efficient)
        if (targetUser.assignedDeliverables.length > 0) {
          const commentsData = targetUser.assignedDeliverables.map(deliverable => ({
            deliverableId: deliverable.id,
            userId: currentDbUser.id,
            content: `Deliverable automatically reassigned from ${targetUser.name} (deleted user) to ${currentDbUser.name}`,
            type: 'STATUS_UPDATE' as const,
            isInternal: true
          }))
          
          await tx.comment.createMany({
            data: commentsData
          })
        }
      }

      // Delete client assignments
      if (targetUser.assignedClients.length > 0) {
        console.log(`👥 Removing user from ${targetUser.assignedClients.length} client assignments...`)
        
        await tx.clientAssignment.deleteMany({
          where: {
            userId: userId
          }
        })
      }

      // Delete the user record
      console.log('📝 Deleting user from database...')
      const deletedUser = await tx.user.delete({
        where: { id: userId }
      })

      // Log the deletion activity
      await tx.activityLog.create({
        data: {
          organizationId: currentDbUser.organizationId,
          userId: currentDbUser.id,
          action: 'deleted',
          resourceType: 'user',
          resourceId: userId,
          resourceName: `${targetUser.name} (${targetUser.email})`,
          metadata: {
            deletedUserRole: targetUser.role,
            deletedUserStatus: targetUser.status,
            reassignedDeliverables: impactAnalysis.activeDeliverablesCount,
            reassignedClients: impactAnalysis.assignedClientsCount,
            deletedBy: currentDbUser.name,
            deletionReason: 'admin_deletion',
            impactAnalysis
          }
        }
      })

      return deletedUser
    })

    console.log('✅ Database operations completed successfully')

    console.log('🎉 USER DELETION COMPLETED SUCCESSFULLY')
    console.log(`  ${isUUID ? '✅ Auth account deleted' : 'ℹ️  Auth account skipped (legacy user)'}: ${userId}`)
    console.log(`  ✅ Database record deleted: ${deletedUser.email}`)
    console.log(`  📋 Deliverables reassigned: ${impactAnalysis.activeDeliverablesCount}`)
    console.log(`  👥 Client assignments updated: ${impactAnalysis.assignedClientsCount}`)

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} has been permanently deleted`,
      deletedUser: {
        id: deletedUser.id,
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role
      },
      impact: {
        reassignedDeliverables: impactAnalysis.activeDeliverablesCount,
        updatedClientAssignments: impactAnalysis.assignedClientsCount,
        reassignedTo: currentDbUser.name
      }
    })

  } catch (error) {
    console.error('❌ DELETE /api/users/[id] CRITICAL ERROR:', error)
    
    // Check if this is a connection-related error and attempt recovery
    if (error instanceof Error && 
        (error.message.includes('prepared statement') || 
         error.message.includes('connection') || 
         error.message.includes('ConnectionError'))) {
      console.log('🔄 Connection error detected, attempting recovery...')
      await recoverPrismaConnection()
    }
    
    if (error instanceof Error) {
      // Authentication errors
      if (error.message.includes('Authentication required')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.message.includes('not found in database')) {
        return NextResponse.json({ error: 'User not found - please complete onboarding' }, { status: 401 })
      }
      
      // Supabase Auth deletion errors
      if (error.message.includes('Failed to delete authentication account')) {
        return NextResponse.json({ 
          error: 'Failed to delete user authentication account',
          details: error.message,
          resolution: 'User may need manual cleanup in Supabase'
        }, { status: 500 })
      }
      
      // General errors
      return NextResponse.json({ 
        error: error.message,
        context: 'User deletion process failed'
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Unknown error occurred during user deletion',
      resolution: 'Check server logs for details'
    }, { status: 500 })
  }
} 