import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

async function authenticateRequest(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  // Get user from database with organization
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      organization: true
    }
  })

  if (!dbUser) {
    throw new Error('User not found in database')
  }

  return { user, dbUser }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/users/complete-profile - Completing user profile')
    
    const { user, dbUser } = await authenticateRequest(request)
    console.log('✅ Request authenticated for user:', dbUser.email)

    const body = await request.json()
    const { 
      firstName, 
      lastName, 
      title, 
      phone, 
      bio, 
      timezone, 
      startDate, 
      favoriteColor, 
      workingHours, 
      skills, 
      interests 
    } = body

    // Validate required fields
    if (!firstName || !lastName || !title) {
      return NextResponse.json(
        { error: 'First name, last name, and title are required' },
        { status: 400 }
      )
    }

    console.log('👤 Updating user profile...')

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: `${firstName} ${lastName}`,
        title: title,
        phone: phone || null,
        bio: bio || null,
        // Store additional profile data in a structured way
        permissions: JSON.stringify({
          ...dbUser.permissions ? JSON.parse(dbUser.permissions as string) : {},
          profile: {
            timezone: timezone || 'America/New_York',
            startDate: startDate || new Date().toISOString().split('T')[0],
            favoriteColor: favoriteColor || '#228B22',
            workingHours: workingHours || { start: '09:00', end: '17:00' },
            skills: skills || [],
            interests: interests || [],
            profileCompleted: true,
            profileCompletedAt: new Date().toISOString()
          }
        }),
        // Update status to ACTIVE if still PENDING
        status: dbUser.status === 'PENDING' ? 'ACTIVE' : dbUser.status,
        // Clear temporary password since profile is complete
        temporaryPassword: null
      }
    })

    console.log('✅ User profile updated successfully')

    // Update Supabase Auth user metadata
    const supabase = await createSupabaseServerClient()
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        firstName,
        lastName,
        title,
        phone,
        name: `${firstName} ${lastName}`,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString()
      }
    })

    if (authUpdateError) {
      console.warn('⚠️ Failed to update Supabase Auth metadata:', authUpdateError.message)
      // Don't fail the request if Auth metadata update fails
    } else {
      console.log('✅ Supabase Auth metadata updated')
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        organizationId: dbUser.organizationId,
        action: 'PROFILE_COMPLETED',
        resourceType: 'user',
        resourceId: user.id,
        resourceName: `${firstName} ${lastName}`,
        newValues: JSON.stringify({
          firstName,
          lastName,
          title,
          hasPhone: !!phone,
          hasBio: !!bio,
          skillsCount: skills?.length || 0,
          interestsCount: interests?.length || 0,
          timezone,
          favoriteColor
        }),
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        metadata: JSON.stringify({
          source: 'onboarding',
          completedSteps: ['basic_info', 'profile_details', 'skills_interests']
        })
      }
    })

    console.log('📊 Activity logged successfully')

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        title: updatedUser.title,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        status: updatedUser.status,
        role: updatedUser.role,
        profileCompleted: true
      }
    })

  } catch (error) {
    console.error('❌ Profile completion error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to complete profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 