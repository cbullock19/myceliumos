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

console.log('🔍 Validating Production Configuration...\n');

// Required environment variables for production
const requiredVars = {
  'NEXT_PUBLIC_APP_URL': {
    description: 'Production app URL',
    expected: 'https://myceliumos.app',
    critical: true
  },
  'RESEND_API_KEY': {
    description: 'Resend API key for email delivery',
    expected: 're_...',
    critical: true
  },
  'FROM_EMAIL': {
    description: 'Email sender address',
    expected: 'hello@myceliumos.app or similar',
    critical: true
  },
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase project URL',
    expected: 'https://*.supabase.co',
    critical: true
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Supabase anonymous key',
    expected: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    critical: true
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase service role key',
    expected: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    critical: true
  },
  'DATABASE_URL': {
    description: 'PostgreSQL database URL',
    expected: 'postgresql://...',
    critical: true
  }
};

// Validation function
function validateProductionConfig() {
  let hasErrors = false;
  let hasWarnings = false;
  
  console.log('📋 Environment Variable Validation:\n');
  
  Object.entries(requiredVars).forEach(([varName, config]) => {
    const value = process.env[varName];
    
    if (!value) {
      console.error(`❌ ${varName} is missing`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Expected: ${config.expected}`);
      console.log(`   Critical: ${config.critical ? 'YES' : 'NO'}\n`);
      hasErrors = true;
    } else {
      // Check for specific issues
      let isValid = true;
      let warning = '';
      
      if (varName === 'NEXT_PUBLIC_APP_URL') {
        if (!value.includes('myceliumos.app')) {
          warning = 'Should point to myceliumos.app for production';
          hasWarnings = true;
        }
        if (value.includes('vercel.app')) {
          console.error(`❌ ${varName} contains Vercel URL: ${value}`);
          console.log(`   This will cause invitation emails to redirect to Vercel!\n`);
          hasErrors = true;
          isValid = false;
        }
      }
      
      if (varName === 'FROM_EMAIL') {
        if (!value.includes('myceliumos.app')) {
          warning = 'Should use verified domain myceliumos.app';
          hasWarnings = true;
        }
      }
      
      if (varName === 'RESEND_API_KEY') {
        if (!value.startsWith('re_')) {
          warning = 'Should start with "re_" for Resend API key';
          hasWarnings = true;
        }
      }
      
      if (isValid) {
        console.log(`✅ ${varName}: ${value}`);
        if (warning) {
          console.log(`   ⚠️  Warning: ${warning}`);
        }
        console.log('');
      }
    }
  });
  
  // Test URL generation
  console.log('🔗 URL Generation Test:');
  const { getProductionSafeBaseUrl } = require('../src/lib/utils.ts');
  
  try {
    const baseUrl = getProductionSafeBaseUrl();
    console.log(`Base URL: ${baseUrl}`);
    
    if (baseUrl.includes('vercel.app')) {
      console.error('❌ URL generation is still using Vercel domain!');
      hasErrors = true;
    } else if (baseUrl.includes('myceliumos.app')) {
      console.log('✅ URL generation is using correct production domain');
    } else {
      console.log('⚠️  URL generation is using unexpected domain');
      hasWarnings = true;
    }
  } catch (error) {
    console.error('❌ Error testing URL generation:', error.message);
    hasErrors = true;
  }
  
  console.log('\n📊 Validation Summary:');
  if (hasErrors) {
    console.error('❌ Production configuration has CRITICAL errors');
    console.log('   Please fix the issues above before deploying to production.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Production configuration has warnings');
    console.log('   Consider addressing the warnings above for optimal production setup.');
  } else {
    console.log('✅ Production configuration is valid!');
    console.log('   Your app is ready for production deployment.');
  }
}

// Run validation
validateProductionConfig(); 