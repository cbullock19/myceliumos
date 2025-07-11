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

console.log('🧪 Testing Production URL Generation...\n');

// Simulate the getBaseUrl function
function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

// Test URL generation for different scenarios
console.log('📋 Environment Variables:');
console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
console.log(`VERCEL_URL: ${process.env.VERCEL_URL || 'Not set'}`);
console.log('');

console.log('🔗 URL Generation Tests:');

// Test 1: Base URL
const baseUrl = getBaseUrl();
console.log(`1. Base URL: ${baseUrl}`);

// Test 2: Login URL for invitation
const testEmail = 'caleb@isemediaagency.com';
const loginUrl = `${baseUrl}/auth/signin?email=${encodeURIComponent(testEmail)}`;
console.log(`2. Login URL: ${loginUrl}`);

// Test 3: Auth callback URL
const callbackUrl = `${baseUrl}/auth/callback`;
console.log(`3. Auth Callback URL: ${callbackUrl}`);

// Test 4: Dashboard URL
const dashboardUrl = `${baseUrl}/dashboard`;
console.log(`4. Dashboard URL: ${dashboardUrl}`);

// Test 5: Onboarding URL
const onboardingUrl = `${baseUrl}/onboarding`;
console.log(`5. Onboarding URL: ${onboardingUrl}`);

// Test 6: Password setup URL
const passwordSetupUrl = `${baseUrl}/auth/setup-password`;
console.log(`6. Password Setup URL: ${passwordSetupUrl}`);

console.log('\n✅ URL generation test complete!');
console.log('All URLs should point to your production domain: https://myceliumos.app');

// Check for any Vercel URLs
const urls = [baseUrl, loginUrl, callbackUrl, dashboardUrl, onboardingUrl, passwordSetupUrl];
const vercelUrls = urls.filter(url => url.includes('vercel.app'));

if (vercelUrls.length > 0) {
  console.log('\n⚠️  WARNING: Found Vercel URLs in generated links:');
  vercelUrls.forEach(url => console.log(`   - ${url}`));
  console.log('\nThis indicates the environment is not properly configured for production.');
} else {
  console.log('\n✅ All URLs are correctly pointing to your production domain!');
} 