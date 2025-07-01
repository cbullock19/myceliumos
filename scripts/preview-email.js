const { render } = require('@react-email/render')
const React = require('react')
const fs = require('fs')
const path = require('path')

// Mock the InvitationEmail component since we can't easily import JSX in Node
const createEmailHTML = () => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Creative Agency</title>
</head>
<body style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
  <div style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; max-width: 600px;">
    
    <!-- Header -->
    <div style="padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0; background-color: #228B22;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 8px;">🎉 Welcome to Creative Agency!</h1>
      <p style="color: rgba(255, 255, 255, 0.8); font-size: 16px; margin: 0;">You've been invited to join our team</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 24px;">
      <h2 style="font-size: 24px; font-weight: bold; color: #333333; margin: 0 0 16px;">Hi John Smith!</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 24px;">
        <strong>Sarah Johnson</strong> has invited you to join <strong>Creative Agency</strong>'s workspace on Mycelium OS as our new <strong>Senior Video Editor</strong>.
      </p>

      <!-- Role Badge -->
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #228B22;">
        <h3 style="font-size: 18px; font-weight: bold; color: #495057; margin: 0 0 8px;">Your Role: Video Editor</h3>
        <p style="font-size: 14px; color: #6c757d; margin: 0;">As a Senior Video Editor, you'll have access to tools and features specific to your role.</p>
      </div>

      <!-- Login Credentials -->
      <div style="margin: 32px 0;">
        <h3 style="font-size: 18px; font-weight: bold; color: #333333; margin: 0 0 16px;">🔑 Your Login Credentials</h3>
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; border: 1px solid #c3e6c3;">
          <p style="font-size: 16px; margin: 8px 0; color: #333333;"><strong>Email:</strong> john.smith@example.com</p>
          <p style="font-size: 16px; margin: 8px 0; color: #333333;">
            <strong>Temporary Password:</strong> 
            <code style="background-color: #f1f3f4; padding: 4px 8px; border-radius: 4px; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; color: #d73a49;">TempPass123!</code>
          </p>
        </div>
      </div>

      <!-- Warning Box -->
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="font-size: 14px; color: #856404; margin: 0;">
          <strong>⚠️ Important:</strong> This is a temporary password. You'll be prompted to create a permanent password on your first login.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="http://localhost:3000/auth/signin" style="font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; display: inline-block; background-color: #228B22;">
          🚀 Accept Invitation & Sign In
        </a>
      </div>

      <p style="font-size: 14px; color: #6c757d; margin: 32px 0 0; line-height: 1.5;">
        <strong>Note:</strong> This invitation expires in 7 days. If you have any questions, please contact Sarah Johnson or reply to this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 24px;">
      <hr style="border-color: #e6ebf1; margin: 20px 0;">
      <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 8px 0;">
        This invitation was sent by <strong>Creative Agency</strong>
      </p>
      <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 8px 0;">
        Powered by <a href="https://myceliumos.com" style="color: #228B22; text-decoration: none;">Mycelium OS</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

// Generate the email preview
const emailHTML = createEmailHTML()

// Write to file
const outputPath = path.join(__dirname, '..', 'email-preview.html')
fs.writeFileSync(outputPath, emailHTML)

console.log('📧 Email preview generated!')
console.log('📁 File location:', outputPath)
console.log('🌐 Open in browser to preview the email template')
console.log('')
console.log('To view the email:')
console.log(`  open ${outputPath}`)
console.log('')
console.log('Or from project root:')
console.log('  open email-preview.html') 