#!/usr/bin/env node

/**
 * 🚀 Vercel Environment Variable Verification Script
 * 
 * This script helps verify that all required environment variables
 * are properly configured in your Vercel deployment.
 */

console.log('🔍 Verifying Vercel Environment Variables...\n');

// Required environment variables for production
const requiredVars = {
  'DATABASE_URL': {
    description: 'PostgreSQL database connection string',
    example: 'postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres',
    critical: true
  },
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase project URL',
    example: 'https://your-project-ref.supabase.co',
    critical: true
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Supabase anonymous key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    critical: true
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase service role key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    critical: true
  }
};

// Optional but recommended variables
const optionalVars = {
  'NEXT_PUBLIC_APP_URL': {
    description: 'Production app URL',
    example: 'https://myceliumos.app',
    critical: false
  },
  'RESEND_API_KEY': {
    description: 'Resend API key for email delivery',
    example: 're_...',
    critical: false
  },
  'FROM_EMAIL': {
    description: 'Email sender address',
    example: 'hello@myceliumos.app',
    critical: false
  }
};

function validateEnvironment() {
  let hasErrors = false;
  let hasWarnings = false;
  
  console.log('📋 Required Environment Variables:\n');
  
  // Check required variables
  Object.entries(requiredVars).forEach(([varName, config]) => {
    const value = process.env[varName];
    
    if (!value) {
      console.error(`❌ ${varName} is missing`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}`);
      console.log(`   Critical: ${config.critical ? 'YES' : 'NO'}\n`);
      hasErrors = true;
    } else if (value.includes('placeholder') || value.includes('your_')) {
      console.error(`❌ ${varName} has placeholder value`);
      console.log(`   Current: ${value}`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName} is configured`);
      if (varName === 'DATABASE_URL') {
        // Mask the password in the output
        const maskedUrl = value.replace(/:([^@]+)@/, ':****@');
        console.log(`   Value: ${maskedUrl}`);
      }
      console.log('');
    }
  });
  
  console.log('📋 Optional Environment Variables:\n');
  
  // Check optional variables
  Object.entries(optionalVars).forEach(([varName, config]) => {
    const value = process.env[varName];
    
    if (!value) {
      console.log(`⚠️  ${varName} is not configured (optional)`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
      hasWarnings = true;
    } else if (value.includes('placeholder') || value.includes('your_')) {
      console.log(`⚠️  ${varName} has placeholder value (optional)`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${varName} is configured`);
      console.log('');
    }
  });
  
  // Summary
  console.log('📊 Summary:');
  if (hasErrors) {
    console.error('❌ Critical environment variables are missing or invalid!');
    console.log('\n🔧 To fix:');
    console.log('1. Go to your Vercel dashboard: https://vercel.com/dashboard');
    console.log('2. Select your project → Settings → Environment Variables');
    console.log('3. Add the missing variables with correct values');
    console.log('4. Redeploy your application');
    console.log('\n📋 Required values can be found in:');
    console.log('   - Supabase Dashboard → Settings → API');
    console.log('   - Supabase Dashboard → Settings → Database');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Some optional variables are not configured');
    console.log('   The app will work, but some features may be limited');
  } else {
    console.log('✅ All environment variables are properly configured!');
  }
  
  console.log('\n🚀 Your Vercel deployment should work correctly now!');
}

// Run validation
validateEnvironment(); 