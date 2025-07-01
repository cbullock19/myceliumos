import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔓 POST /api/users/activate - Activating user account')
    
    const body = await request.json()
    const { email, temporaryPassword, newPassword } = body

    if (!email || !temporaryPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Email, temporary password, and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Find pending user with matching credentials
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        status: 'PENDING',
        temporaryPassword: temporaryPassword // In production, this should be hashed comparison
      },
      include: {
        organization: {
          include: {
            branding: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or invitation has expired' },
        { status: 401 }
      )
    }

    // Check if invitation has expired (7 days)
    const inviteAge = Date.now() - (user.invitedAt?.getTime() || 0)
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
    
    if (inviteAge > sevenDaysInMs) {
      return NextResponse.json(
        { error: 'Invitation has expired. Please request a new invitation.' },
        { status: 401 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update existing Supabase auth user password using admin API
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          organizationId: user.organizationId,
          role: user.role
        }
      }
    )

    if (updateError) {
      console.error('Supabase password update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Update user record to active status
    const activatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        hashedPassword: hashedPassword,
        temporaryPassword: null, // Clear temporary password
        emailVerified: true,
        lastLoginAt: new Date()
      }
    })

    // Log activation activity
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'activated',
        resourceType: 'user',
        resourceId: user.id,
        resourceName: user.name,
        metadata: {
          activationType: 'invitation_acceptance'
        }
      }
    })

    console.log('✅ User account activated successfully:', user.email)

    return NextResponse.json({
      success: true,
      user: {
        id: activatedUser.id,
        email: activatedUser.email,
        name: activatedUser.name,
        role: activatedUser.role,
        status: activatedUser.status
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug
      },
      message: 'Account activated successfully'
    })

  } catch (error) {
    console.error('❌ POST /api/users/activate error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to activate account' }, { status: 500 })
  }
} 