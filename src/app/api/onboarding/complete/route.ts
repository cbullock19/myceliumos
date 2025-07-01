import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createApiError, generateOrganizationSlug } from '@/lib/utils'
import { createUserInvitation } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(createApiError('Not authenticated', 401), { status: 401 })
    }

    const body = await request.json()
    const { basicInfo, selectedServices, branding, teamInvites } = body

    // Get the user's organization
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    })

    if (!dbUser || !dbUser.organization) {
      return NextResponse.json(createApiError('User or organization not found', 404), { status: 404 })
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update organization with basic info
      const updatedOrg = await tx.organization.update({
        where: { id: dbUser.organizationId },
        data: {
          name: basicInfo.organizationName,
          slug: generateOrganizationSlug(basicInfo.organizationName),
          website: basicInfo.website || null,
          industry: basicInfo.industry
        }
      })

      // 2. Update organization branding
      await tx.organizationBranding.update({
        where: { organizationId: dbUser.organizationId },
        data: {
          primaryColor: branding.primaryColor,
          logoUrl: branding.logoUrl || null
        }
      })

      // 3. Create service types
      const serviceTypePromises = selectedServices.map((service: any, index: number) => {
        return tx.serviceType.create({
          data: {
            organizationId: dbUser.organizationId,
            name: service.name,
            slug: generateOrganizationSlug(service.name),
            description: service.description,
            workflowType: 'PROJECT', // Default workflow type
            sortOrder: index,
            deliverableFields: {
              create: service.defaultFields.map((field: any, fieldIndex: number) => ({
                name: field.name,
                slug: generateOrganizationSlug(field.name),
                type: field.type,
                isRequired: field.required,
                sortOrder: fieldIndex,
                options: field.options ? JSON.stringify(field.options) : null
              }))
            }
          }
        })
      })

      await Promise.all(serviceTypePromises)

      // 4. Create team invitations
      const invitationPromises = teamInvites
        .filter((invite: any) => invite.email && invite.role)
        .map(async (invite: any) => {
          try {
            const invitation = await createUserInvitation(
              dbUser.organizationId,
              invite.email,
              invite.role as UserRole,
              dbUser.id
            )
            return invitation
          } catch (error) {
            console.error(`Failed to create invitation for ${invite.email}:`, error)
            return null
          }
        })

      const invitations = await Promise.all(invitationPromises)
      const successfulInvitations = invitations.filter(Boolean)

      // 5. Mark user as active (onboarding complete)
      await tx.user.update({
        where: { id: dbUser.id },
        data: { status: 'ACTIVE' }
      })

      // 6. Create welcome activity log
      await tx.activityLog.create({
        data: {
          organizationId: dbUser.organizationId,
          userId: dbUser.id,
          action: 'organization.onboarding_completed',
          resourceType: 'Organization',
          resourceId: dbUser.organizationId,
          metadata: {
            servicesCount: selectedServices.length,
            invitationsCount: successfulInvitations.length,
            teamSize: basicInfo.teamSize,
            industry: basicInfo.industry
          }
        }
      })

      return {
        organization: updatedOrg,
        servicesCreated: selectedServices.length,
        invitationsSent: successfulInvitations.length,
        invitationsFailed: teamInvites.length - successfulInvitations.length
      }
    })

    // Send welcome notification (non-blocking)
    try {
      await prisma.notification.create({
        data: {
          organizationId: dbUser.organizationId,
          type: 'SYSTEM_MAINTENANCE',
          title: 'Welcome to Mycelium OS!',
          message: `Your agency workspace is ready. We've set up ${result.servicesCreated} service types and sent ${result.invitationsSent} team invitations.`,
          recipients: {
            create: {
              userId: dbUser.id,
              channel: 'app'
            }
          }
        }
      })
    } catch (notificationError) {
      console.error('Failed to create welcome notification:', notificationError)
      // Don't fail the request for notification errors
    }

    return NextResponse.json(createApiResponse({
      message: 'Onboarding completed successfully!',
      organization: result.organization,
      stats: {
        servicesCreated: result.servicesCreated,
        invitationsSent: result.invitationsSent,
        invitationsFailed: result.invitationsFailed
      }
    }))

  } catch (error) {
    console.error('Onboarding completion error:', error)
    
    // Return more specific error information
    if (error instanceof Error) {
      return NextResponse.json(createApiError(error.message, 500), { status: 500 })
    }
    
    return NextResponse.json(createApiError('Failed to complete onboarding', 500), { status: 500 })
  }
} 