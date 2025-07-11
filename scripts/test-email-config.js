#!/usr/bin/env node

// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Load .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const { Resend } = require('resend');

console.log('🧪 Testing Email Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ Not set'}`);
console.log('');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailConfiguration() {
  try {
    console.log('📧 Testing Resend API configuration...');
    
    // Test with a simple email
    const testEmail = {
      to: ['test@example.com'], // This won't actually send, just test the API
      from: process.env.FROM_EMAIL || 'hello@myceliumos.app',
      subject: 'Test Email Configuration',
      html: '<p>This is a test email to verify the configuration.</p>'
    };
    
    console.log('📨 Sending test email...');
    console.log(`From: ${testEmail.from}`);
    console.log(`To: ${testEmail.to[0]}`);
    
    const { data, error } = await resend.emails.send(testEmail);
    
    if (error) {
      console.error('❌ Resend API Error:', error);
      
      // Check for domain verification issues
      if (error.message.includes('domain') && error.message.includes('verified')) {
        console.log('\n🔍 Domain Verification Issue Detected:');
        console.log('The error suggests a domain verification problem.');
        console.log('Please check:');
        console.log('1. Your domain is verified in Resend dashboard');
        console.log('2. The FROM_EMAIL uses the correct verified domain');
        console.log('3. DNS records are properly configured');
      }
      
      return false;
    }
    
    console.log('✅ Resend API test successful!');
    console.log(`Message ID: ${data?.id}`);
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function checkDomainConfiguration() {
  console.log('\n🔍 Domain Configuration Analysis:');
  
  const fromEmail = process.env.FROM_EMAIL || 'hello@myceliumos.app';
  const domain = fromEmail.split('@')[1]?.split('>')[0];
  
  console.log(`Current FROM_EMAIL: ${fromEmail}`);
  console.log(`Extracted domain: ${domain}`);
  
  if (domain === 'myceliumos.app') {
    console.log('✅ Using verified domain: myceliumos.app');
  } else if (domain === 'myceliumos.com') {
    console.log('❌ Using unverified domain: myceliumos.com');
    console.log('   This domain is not verified in Resend.');
  } else {
    console.log(`⚠️  Using domain: ${domain}`);
    console.log('   Please verify this domain is configured in Resend.');
  }
}

// Run tests
async function runTests() {
  await checkDomainConfiguration();
  await testEmailConfiguration();
  
  console.log('\n📋 Summary:');
  console.log('1. Check the domain configuration above');
  console.log('2. If using myceliumos.com, change to myceliumos.app');
  console.log('3. Verify the domain is properly configured in Resend dashboard');
  console.log('4. Test with a real email address if needed');
}

runTests().catch(console.error); 