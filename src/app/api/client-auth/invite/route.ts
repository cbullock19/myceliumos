import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'
import { createApiResponse, createApiError, getProductionSafeBaseUrl, getBaseUrl } from '@/lib/utils'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

interface InviteRequest {
  email: string
  clientId: string
  name: string
  role: 'PRIMARY' | 'COLLABORATOR'
  permissions?: {
    canApprove?: boolean
    canDownload?: boolean
    canComment?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(createApiError('Not authenticated', 401), { status: 401 })
    }

    const body: InviteRequest = await request.json()
    const { email, clientId, name, role, permissions } = body

    // Validate required fields
    if (!email || !clientId || !name || !role) {
      return NextResponse.json(createApiError('Missing required fields', 400), { status: 400 })
    }

    // Check if user has permission to invite to this client
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    })

    if (!adminUser || !adminUser.organizationId) {
      return NextResponse.json(createApiError('Organization access required', 403), { status: 403 })
    }

    // Verify the client exists and belongs to the organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: adminUser.organizationId
      },
      include: {
        organization: {
          include: {
            branding: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(createApiError('Client not found', 404), { status: 404 })
    }

    // Check if client user already exists
    const existingClientUser = await prisma.clientUser.findUnique({
      where: { email }
    })

    if (existingClientUser) {
      return NextResponse.json(createApiError('A user with this email already exists', 409), { status: 409 })
    }

    // Generate secure invitation token
    const invitationToken = jwt.sign(
      {
        email,
        clientId,
        name,
        role,
        permissions: permissions || {
          canApprove: role === 'PRIMARY',
          canDownload: true,
          canComment: true
        },
        invitedBy: user.id,
        organizationId: adminUser.organizationId,
        type: 'client_invitation'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Create client user record (inactive until password is set)
    const clientUser = await prisma.clientUser.create({
      data: {
        clientId,
        email,
        name,
        role: role as any, // Type assertion for now until Prisma client is regenerated
        isActive: false,
        emailVerified: false,
        canApprove: permissions?.canApprove ?? (role === 'PRIMARY'),
        canDownload: permissions?.canDownload ?? true,
        canComment: permissions?.canComment ?? true
      }
    })

    // Send invitation email
    const baseUrl = getProductionSafeBaseUrl()
    const setupUrl = `${baseUrl}/client-portal/setup-password?token=${invitationToken}`
    
    // Debug URL generation
    console.log('🔍 URL Generation Debug:')
    console.log('  NODE_ENV:', process.env.NODE_ENV)
    console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('  VERCEL_URL:', process.env.VERCEL_URL)
    console.log('  getBaseUrl():', getBaseUrl())
    console.log('  getProductionSafeBaseUrl():', baseUrl)
    console.log('  Final setupUrl:', setupUrl)

    const emailContent = {
      from: process.env.FROM_EMAIL || 'hello@myceliumos.app',
      to: [email],
      subject: `You've been invited to ${client.organization.name} client portal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${client.organization.branding?.primaryColor || '#059669'}, ${client.organization.branding?.primaryColor || '#059669'}dd); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to ${client.organization.name}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been invited to access your client portal</p>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You've been invited to access the client portal for <strong>${client.name}</strong> at ${client.organization.name}.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Your role: <strong>${role}</strong><br>
              You can: ${permissions?.canApprove ? 'Approve deliverables, ' : ''}${permissions?.canDownload ? 'Download files, ' : ''}${permissions?.canComment ? 'Add comments' : ''}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupUrl}" style="background: ${client.organization.branding?.primaryColor || '#059669'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Set Up Your Account
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              This invitation link will expire in 7 days. If you have any questions, please contact your project team.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} ${client.organization.name}. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `You've been invited to access the client portal for ${client.name} at ${client.organization.name}. Click here to set up your account: ${setupUrl}`
    }

    try {
      await resend.emails.send(emailContent)
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json(createApiResponse({
      message: 'Invitation sent successfully',
      clientUser: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        role: clientUser.role,
        isActive: clientUser.isActive
      }
    }))

  } catch (error) {
    console.error('Client invitation error:', error)
    return NextResponse.json(createApiError('Failed to send invitation'), { status: 500 })
  }
} 