import { Resend } from 'resend'
import { render } from '@react-email/render'
import InvitationEmail from '@/emails/InvitationEmail'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
  to: string
  userName: string
  userTitle: string
  inviterName: string
  organizationName: string
  role: string
  temporaryPassword: string
  organizationBranding?: {
    primaryColor?: string
    logoUrl?: string
  }
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  emailContent?: string
  needsFallback?: boolean
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  console.log('📧 ===== RESEND EMAIL DELIVERY =====')
  console.log('📧 Sending invitation email to:', params.to)
  console.log('📧 User:', params.userName)
  console.log('📧 Organization:', params.organizationName)
  console.log('📧 Role:', params.role)

  // Check for Resend API key
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not configured')
    console.log('📧 To set up Resend:')
    console.log('  1. Sign up at https://resend.com')
    console.log('  2. Get your API key from the dashboard')
    console.log('  3. Add RESEND_API_KEY=re_... to your .env.local file')
    
    // Return fallback with email content for debugging
    const emailContent = await render(InvitationEmail({
      userName: params.userName,
      userTitle: params.userTitle,
      inviterName: params.inviterName,
      organizationName: params.organizationName,
      role: params.role,
      temporaryPassword: params.temporaryPassword,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin?email=${encodeURIComponent(params.to)}`,
      organizationBranding: params.organizationBranding
    }))

    return {
      success: false,
      error: 'Resend API key not configured',
      emailContent,
      needsFallback: true
    }
  }

  try {
    // Generate the login URL with pre-filled email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin?email=${encodeURIComponent(params.to)}`

    // Send email using Resend with React Email template
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Mycelium OS <onboarding@resend.dev>',
      to: [params.to],
      subject: `Welcome to ${params.organizationName}! Your account is ready 🎉`,
      react: InvitationEmail({
        userName: params.userName,
        userTitle: params.userTitle,
        inviterName: params.inviterName,
        organizationName: params.organizationName,
        role: params.role,
        temporaryPassword: params.temporaryPassword,
        loginUrl,
        organizationBranding: params.organizationBranding
      }),
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
        needsFallback: true
      }
    }

    console.log('✅ Email sent successfully!')
    console.log('📧 Message ID:', data?.id)
    console.log('📧 Recipient:', params.to)
    console.log('📧 Subject: Welcome to', params.organizationName)

    return {
      success: true,
      messageId: data?.id
    }

  } catch (error) {
    console.error('❌ Email delivery failed:', error)
    
    // Generate fallback email content for debugging
    const emailContent = await render(InvitationEmail({
      userName: params.userName,
      userTitle: params.userTitle,
      inviterName: params.inviterName,
      organizationName: params.organizationName,
      role: params.role,
      temporaryPassword: params.temporaryPassword,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin?email=${encodeURIComponent(params.to)}`,
      organizationBranding: params.organizationBranding
    }))

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
      emailContent,
      needsFallback: true
    }
  }
}

// Future: Additional email types
export async function sendDeliverableNotification(params: {
  to: string
  userName: string
  deliverableName: string
  dueDate: string
  organizationName: string
}) {
  // TODO: Implement deliverable notification email
  console.log('📧 Deliverable notification (coming soon):', params)
}

export async function sendClientWelcomeEmail(params: {
  to: string
  clientName: string
  organizationName: string
  portalUrl: string
}) {
  // TODO: Implement client welcome email
  console.log('📧 Client welcome email (coming soon):', params)
}

// Email validation utility
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Email domain validation (for security)
export function isBusinessEmail(email: string): boolean {
  const disposableEmailDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  return domain && !disposableEmailDomains.includes(domain)
} 