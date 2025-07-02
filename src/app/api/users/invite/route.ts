import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

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

export async function POST(request: NextRequest) {
  let authUserId: string | null = null
  let supabaseAdmin: any = null
  
  try {
    console.log('📨 POST /api/users/invite - Starting user invitation')
    
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

    // Generate secure temporary password
    const temporaryPassword = generateSecurePassword()
    const fullName = `${firstName} ${lastName}`

    console.log('🔄 Starting atomic transaction for user creation...')

    // Execute all database operations in a single transaction to prevent connection issues
    const result = await prisma.$transaction(async (tx) => {
      console.log('🔍 Checking for existing user in transaction...')
      
      // Check if user already exists in the organization
      const existingUser = await tx.user.findFirst({
        where: {
          email: email,
          organizationId: dbUser.organizationId
        }
      })

      if (existingUser) {
        throw new Error('User with this email already exists in your organization')
      }

      console.log('👤 Creating Supabase Auth account...')
      
      // Create Supabase Auth user using Admin API
      supabaseAdmin = createSupabaseAdminClient()
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

      // Store auth user ID for potential rollback
      authUserId = authUser.user.id

      console.log('✅ Supabase Auth user created:', {
        id: authUser.user.id,
        email: authUser.user.email,
        emailConfirmed: authUser.user.email_confirmed_at ? true : false
      })

      console.log('📝 Creating database user record in transaction...')
      
      // Create the database user record within the transaction
      const newUser = await tx.user.create({
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

      // Create activity log within the same transaction
      await tx.activityLog.create({
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
            authAccountCreated: true,
            databaseRecordCreated: true
          }
        }
      })

      // Return all data needed for email and response
      return {
        authUser: authUser.user,
        newUser,
        organization: dbUser.organization
      }
    }, {
      timeout: 30000, // 30 second timeout for long operations
      isolationLevel: 'ReadCommitted' // Prevent read conflicts
    })

    console.log('✅ Transaction completed successfully')

    // Send invitation email outside of transaction (non-critical)
    console.log('📧 Sending invitation email...')
    const emailResult = await sendInvitationEmail({
      to: email,
      userName: fullName,
      userTitle: title,
      inviterName: dbUser.name,
      organizationName: result.organization.name,
      role: role,
      temporaryPassword: temporaryPassword,
      organizationBranding: result.organization.branding
    })

    // Update activity log with email status (separate transaction to avoid blocking)
    try {
      await prisma.activityLog.updateMany({
        where: {
          resourceId: result.newUser.id,
          action: 'invited'
        },
        data: {
          metadata: {
            role: role,
            supabaseAuthId: result.authUser.id,
            authAccountCreated: true,
            databaseRecordCreated: true,
            invitationType: emailResult.success ? 'email' : 'manual',
            emailDelivered: emailResult.success,
            emailError: emailResult.error
          }
        }
      })
    } catch (logError) {
      console.warn('⚠️ Failed to update activity log with email status:', logError)
      // Don't fail the entire operation for logging issues
    }

    console.log('🎉 USER INVITATION PROCESS COMPLETE:')
    console.log('  ✅ Supabase Auth account created:', result.authUser.id)
    console.log('  ✅ Database user record created:', result.newUser.id)
    console.log('  📧 Email result:', emailResult.success ? 'SUCCESS' : `FAILED: ${emailResult.error}`)

    // Determine response based on email delivery status
    if (emailResult.needsFallback) {
      console.log('📧 EMAIL NOT DELIVERED - Providing fallback with temporary password')
      return NextResponse.json({
        success: true,
        user: {
          id: result.newUser.id,
          email: result.newUser.email,
          name: result.newUser.name,
          role: result.newUser.role,
          status: result.newUser.status
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
          id: result.newUser.id,
          email: result.newUser.email,
          name: result.newUser.name,
          role: result.newUser.role,
          status: result.newUser.status
        },
        emailDelivered: true,
        message: `✅ Invitation sent successfully to ${email}`
      })
    }

  } catch (error) {
    console.error('❌ POST /api/users/invite CRITICAL ERROR:', error)
    
    // Perform Supabase auth cleanup if needed (outside of database transaction)
    if (authUserId && supabaseAdmin) {
      console.log('🔄 Cleaning up Supabase Auth user due to error...')
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        console.log('✅ Supabase Auth user cleanup successful')
      } catch (rollbackError) {
        console.error('❌ Failed to clean up Supabase Auth user:', rollbackError)
        // Log but don't throw - the main error should be returned
      }
    }
    
    if (error instanceof Error) {
      // Authentication errors
      if (error.message.includes('Authentication required')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.message.includes('not found in database')) {
        return NextResponse.json({ error: 'User not found - please complete onboarding' }, { status: 401 })
      }
      
      // User already exists
      if (error.message.includes('already exists in your organization')) {
        return NextResponse.json({ 
          error: 'User with this email already exists in your organization' 
        }, { status: 409 })
      }
      
      // Supabase Auth creation errors
      if (error.message.includes('Failed to create authentication account')) {
        return NextResponse.json({ 
          error: 'Failed to create user account in authentication system',
          details: error.message,
          resolution: 'Check Supabase configuration and try again'
        }, { status: 500 })
      }
      
      // Database/transaction errors
      if (error.message.includes('transaction') || error.message.includes('prepared statement')) {
        return NextResponse.json({ 
          error: 'Database operation failed',
          details: 'Transaction or connection error occurred',
          resolution: 'Please try again. If the problem persists, contact support.'
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
  }
  // Connection management handled by Prisma singleton - no manual disconnect needed
} 