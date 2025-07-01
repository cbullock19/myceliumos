import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'
import { PrismaClient } from '@prisma/client'
import { sendInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

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
      organization: {
        include: {
          branding: true
        }
      }
    }
  })

  if (!dbUser || !dbUser.organization) {
    throw new Error('User not found in database - please complete onboarding')
  }

  return { user, dbUser }
}

function generateSecurePassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

function generateInvitationToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Local sendInvitationEmail function removed - now using imported Resend service

export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST /api/users/invite - Sending user invitation')
    
    const { user, dbUser } = await authenticateRequest(request)
    console.log('✅ Request authenticated for org:', dbUser.organization.name)

    // Check if user has permission to invite (Admin only for now)
    if (dbUser.role !== 'ADMIN') {
      console.log('❌ Insufficient permissions for user invitation')
      return NextResponse.json(
        { error: 'Insufficient permissions to invite users' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role, firstName, lastName, title, phone, customPermissions } = body

    if (!email || !role || !firstName || !lastName || !title) {
      return NextResponse.json(
        { error: 'Email, role, first name, last name, and title are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        organizationId: dbUser.organizationId
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists in your organization' },
        { status: 409 }
      )
    }

    // Generate secure temporary password and invitation token
    const temporaryPassword = generateSecurePassword()
    const invitationToken = generateInvitationToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    console.log('👤 Creating Supabase Auth account...')
    
    // First, create Supabase Auth user using Admin API
    const supabaseAdmin = createSupabaseAdminClient()
    const fullName = `${firstName} ${lastName}`
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true, // Mark as confirmed so they can log in immediately
      user_metadata: {
        organizationId: dbUser.organizationId,
        role: role,
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        title: title,
        phone: phone || null,
        companyName: dbUser.organization.name,
        organizationSlug: dbUser.organization.slug,
        invitedBy: dbUser.id,
        invitedAt: new Date().toISOString(),
        temporaryPassword: true // Flag to prompt password change on first login
      }
    })

    if (authError) {
      console.error('❌ Failed to create Supabase Auth user:', authError)
      throw new Error(`Failed to create authentication account: ${authError.message}`)
    }

    if (!authUser.user) {
      throw new Error('Failed to create authentication account: No user returned')
    }

    console.log('✅ Supabase Auth user created:', {
      id: authUser.user.id,
      email: authUser.user.email,
      emailConfirmed: authUser.user.email_confirmed_at ? true : false
    })

    // Now create the database user record linked to the auth user
    console.log('📝 Creating database user record...')
    let newUser
    try {
      newUser = await prisma.user.create({
        data: {
          id: authUser.user.id, // Use the Supabase Auth user ID
          email: email,
          name: fullName,
          title: title,
          phone: phone || null,
          role: role,
          status: 'PENDING',
          organizationId: dbUser.organizationId,
          invitedBy: dbUser.id,
          invitedAt: new Date(),
          temporaryPassword: temporaryPassword, // Store plaintext temporarily for email
          emailVerified: true, // Already confirmed in Supabase Auth
          permissions: customPermissions ? JSON.stringify(customPermissions) : undefined
        }
      })
      console.log('✅ Database user record created:', {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      })
    } catch (dbError) {
      console.error('❌ Failed to create database user record:', dbError)
      
      // Rollback: Delete the Supabase Auth user if database creation fails
      console.log('🔄 Rolling back Supabase Auth user creation...')
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('✅ Supabase Auth user rollback successful')
      } catch (rollbackError) {
        console.error('❌ Failed to rollback Supabase Auth user:', rollbackError)
      }
      
      throw new Error(`Failed to create database user record: ${dbError}`)
    }

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      to: email,
      userName: fullName,
      userTitle: title,
      inviterName: dbUser.name,
      organizationName: dbUser.organization.name,
      role: role,
      temporaryPassword: temporaryPassword,
      organizationBranding: dbUser.organization.branding
    })

    console.log('🎉 USER INVITATION PROCESS COMPLETE:')
    console.log('  ✅ Supabase Auth account created:', authUser.user.id)
    console.log('  ✅ Database user record created:', newUser.id)
    console.log('  📧 Email result:', emailResult.success ? 'SUCCESS' : `FAILED: ${emailResult.error}`)

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: dbUser.organizationId,
        userId: dbUser.id,
        action: 'invited',
        resourceType: 'user',
        resourceId: newUser.id,
        resourceName: email,
        metadata: {
          role: role,
          supabaseAuthId: authUser.user.id,
          invitationType: emailResult.success ? 'email' : 'manual',
          emailDelivered: emailResult.success,
          emailError: emailResult.error,
          authAccountCreated: true,
          databaseRecordCreated: true
        }
      }
    })

    // Determine response based on email delivery status
    if (emailResult.needsFallback) {
      console.log('📧 EMAIL NOT DELIVERED - Providing fallback with temporary password')
      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status
        },
        emailDelivered: false,
        emailError: emailResult.error,
        temporaryPassword: temporaryPassword, // Include temp password since email failed
        message: `✅ User created successfully! ⚠️ Email delivery failed: ${emailResult.error}`,
        fallbackMessage: `Since email delivery failed, please share these login credentials with ${email} manually:`,
        loginInstructions: {
          email: email,
          temporaryPassword: temporaryPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin`,
          note: "They'll be prompted to set a permanent password on first login."
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status
        },
        emailDelivered: true,
        message: `✅ Invitation sent successfully to ${email}`
      })
    }

  } catch (error) {
    console.error('❌ POST /api/users/invite CRITICAL ERROR:', error)
    
    if (error instanceof Error) {
      // Authentication errors
      if (error.message.includes('Authentication required')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.message.includes('not found in database')) {
        return NextResponse.json({ error: 'User not found - please complete onboarding' }, { status: 401 })
      }
      
      // Supabase Auth creation errors
      if (error.message.includes('Failed to create authentication account')) {
        return NextResponse.json({ 
          error: 'Failed to create user account in authentication system',
          details: error.message,
          resolution: 'Check Supabase configuration and try again'
        }, { status: 500 })
      }
      
      // Database creation errors (after auth account was created)
      if (error.message.includes('Failed to create database user record')) {
        return NextResponse.json({ 
          error: 'Authentication account created but database record failed',
          details: error.message,
          resolution: 'Contact support - user may already exist in auth system'
        }, { status: 500 })
      }
      
      // General errors
      return NextResponse.json({ 
        error: error.message,
        context: 'User invitation process failed'
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Unknown error occurred during user invitation',
      resolution: 'Check server logs for details'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 