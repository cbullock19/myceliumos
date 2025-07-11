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

console.log('🧪 Testing URL Generation...\n');

// Simulate the getBaseUrl function
function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

// Test URL generation
console.log('📋 Environment Variables:');
console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
console.log(`VERCEL_URL: ${process.env.VERCEL_URL || 'Not set'}`);
console.log('');

console.log('🔗 Generated URLs:');
const baseUrl = getBaseUrl();
console.log(`Base URL: ${baseUrl}`);

// Test login URL generation
const testEmail = 'caleb@isemediaagency.com';
const loginUrl = `${baseUrl}/auth/signin?email=${encodeURIComponent(testEmail)}`;
console.log(`Login URL for ${testEmail}: ${loginUrl}`);

console.log('\n✅ URL generation test complete!');
console.log('The login URL should now point to your custom domain instead of Vercel.'); 