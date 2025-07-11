import { Resend } from 'resend'
import { render } from '@react-email/render'
import InvitationEmail from '@/emails/InvitationEmail'
import { getProductionSafeBaseUrl } from './utils'

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
    secondaryColor?: string
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
    const baseUrl = getProductionSafeBaseUrl()
    const emailContent = await render(InvitationEmail({
      userName: params.userName,
      userTitle: params.userTitle,
      inviterName: params.inviterName,
      organizationName: params.organizationName,
      role: params.role,
      temporaryPassword: params.temporaryPassword,
      loginUrl: `${baseUrl}/auth/signin?email=${encodeURIComponent(params.to)}`,
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
    console.log('📧 Preparing invitation email for:', params.to)

    // Get the production URL dynamically
    const baseUrl = getProductionSafeBaseUrl()
    const loginUrl = `${baseUrl}/auth/signin?email=${encodeURIComponent(params.to)}`

    console.log('🌐 Using base URL:', baseUrl)
    console.log('🔗 Login URL:', loginUrl)

    // Use environment variable for from address, fallback to verified domain
    const fromAddress = process.env.FROM_EMAIL || 'hello@myceliumos.app'
    
    console.log('📧 Using from address:', fromAddress)

    const emailData = {
      to: [params.to],
      from: fromAddress,
      subject: `Welcome to ${params.organizationName} - Your Account is Ready!`,
      react: InvitationEmail({
        userName: params.userName,
        userTitle: params.userTitle,
        inviterName: params.inviterName,
        organizationName: params.organizationName,
        role: params.role,
        temporaryPassword: params.temporaryPassword,
        loginUrl: loginUrl,
        organizationBranding: params.organizationBranding
      })
    }

    console.log('📨 Sending email via Resend...')
    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error('❌ Resend API error:', error)
      return {
        success: false,
        error: `Email delivery failed: ${error.message}`,
        needsFallback: true
      }
    }

    console.log('✅ Email sent successfully:', data?.id)
    return {
      success: true,
      messageId: data?.id
    }

  } catch (error) {
    console.error('❌ Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
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