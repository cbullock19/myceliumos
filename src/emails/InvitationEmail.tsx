import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface InvitationEmailProps {
  userName: string
  userTitle: string
  inviterName: string
  organizationName: string
  role: string
  temporaryPassword: string
  loginUrl: string
  organizationBranding?: {
    primaryColor?: string
    logoUrl?: string
  }
}

export const InvitationEmail = ({
  userName = 'John Smith',
  userTitle = 'Senior Video Editor',
  inviterName = 'Sarah Johnson',
  organizationName = 'Creative Agency',
  role = 'VIDEO_EDITOR',
  temporaryPassword = 'temp123',
  loginUrl = 'http://localhost:3000/auth/signin',
  organizationBranding = {}
}: InvitationEmailProps) => {
  const primaryColor = organizationBranding.primaryColor || '#228B22'
  
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Administrator',
      'VIDEO_EDITOR': 'Video Editor',
      'SEO_STRATEGIST': 'SEO Strategist', 
      'WEBSITE_DESIGNER': 'Website Designer',
      'FILMER': 'Filmer',
      'CUSTOM': 'Team Member'
    }
    return roleMap[role] || 'Team Member'
  }

  return (
    <Html>
      <Head />
      <Preview>Welcome to {organizationName}! Your account is ready.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{...header, backgroundColor: primaryColor}}>
            {organizationBranding.logoUrl && (
              <Img
                src={organizationBranding.logoUrl}
                width="60"
                height="60"
                alt={organizationName}
                style={logo}
              />
            )}
            <Text style={headerTitle}>
              🎉 Welcome to {organizationName}!
            </Text>
            <Text style={headerSubtitle}>
              You've been invited to join our team
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {userName}!</Text>
            
            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to join{' '}
              <strong>{organizationName}</strong>'s workspace on Mycelium OS as our new{' '}
              <strong>{userTitle}</strong>.
            </Text>

            {/* Role Badge */}
            <Section style={roleBadge}>
              <Text style={roleTitle}>Your Role: {getRoleDisplayName(role)}</Text>
              <Text style={roleDescription}>
                As a {userTitle}, you'll have access to tools and features specific to your role.
              </Text>
            </Section>

            {/* Login Credentials */}
            <Section style={credentialsSection}>
              <Text style={credentialsTitle}>🔑 Your Login Credentials</Text>
              <Section style={credentialsBox}>
                <Text style={credentialItem}>
                  <strong>Email:</strong> {/* This will be filled by the API */}
                </Text>
                <Text style={credentialItem}>
                  <strong>Temporary Password:</strong> <code style={passwordCode}>{temporaryPassword}</code>
                </Text>
              </Section>
            </Section>

            {/* Warning Box */}
            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>⚠️ Important:</strong> This is a temporary password. You'll be prompted to create a permanent password on your first login.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={{...button, backgroundColor: primaryColor}} href={loginUrl}>
                🚀 Accept Invitation & Sign In
              </Button>
            </Section>

            <Text style={note}>
              <strong>Note:</strong> This invitation expires in 7 days. If you have any questions, please contact {inviterName} or reply to this email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              This invitation was sent by <strong>{organizationName}</strong>
            </Text>
            <Text style={footerText}>
              Powered by{' '}
              <Link href="https://myceliumos.app" style={footerLink}>
                Mycelium OS
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  borderRadius: '12px 12px 0 0',
}

const logo = {
  margin: '0 auto 16px',
  borderRadius: '8px',
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const headerSubtitle = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '16px',
  margin: '0',
}

const content = {
  padding: '32px 24px',
}

const greeting = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '0 0 16px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 24px',
}

const roleBadge = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  borderLeft: '4px solid #228B22',
}

const roleTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#495057',
  margin: '0 0 8px',
}

const roleDescription = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '0',
}

const credentialsSection = {
  margin: '32px 0',
}

const credentialsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '0 0 16px',
}

const credentialsBox = {
  backgroundColor: '#e8f5e8',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #c3e6c3',
}

const credentialItem = {
  fontSize: '16px',
  margin: '8px 0',
  color: '#333333',
}

const passwordCode = {
  backgroundColor: '#f1f3f4',
  padding: '4px 8px',
  borderRadius: '4px',
  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  fontSize: '14px',
  color: '#d73a49',
}

const warningBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const warningText = {
  fontSize: '14px',
  color: '#856404',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '8px',
  display: 'inline-block',
}

const note = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '32px 0 0',
  lineHeight: '1.5',
}

const footer = {
  padding: '24px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footerText = {
  color: '#6c757d',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '8px 0',
}

const footerLink = {
  color: '#228B22',
  textDecoration: 'none',
}

export default InvitationEmail 