#!/usr/bin/env node

console.log('🔍 Validating environment configuration...\n');

// Required environment variables
const requiredVars = {
  'DATABASE_URL': {
    description: 'PostgreSQL database connection string',
    example: 'postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres',
    invalid: ['postgresql://placeholder', 'postgresql://postgres:password@localhost']
  },
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase project URL',
    example: 'https://your-project-ref.supabase.co',
    invalid: ['https://placeholder.supabase.co', 'placeholder_url']
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Supabase anonymous key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    invalid: ['placeholder_key', 'your_anon_key_here']
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase service role key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    invalid: ['placeholder_service_key', 'your_service_role_key_here']
  }
};

// Validate environment variables
function validateEnv() {
  let hasErrors = false;
  
  console.log('📋 Checking required variables from process environment:\n');
  
  Object.entries(requiredVars).forEach(([varName, config]) => {
    const value = process.env[varName];
    
    if (!value) {
      console.error(`❌ ${varName} is missing`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
      hasErrors = true;
    } else if (config.invalid.some(invalid => value.includes(invalid))) {
      console.error(`❌ ${varName} has placeholder/invalid value`);
      console.log(`   Current: ${value}`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName} is configured`);
    }
  });
  
  if (hasErrors) {
    console.error('\n💥 Environment validation failed!');
    console.log('\n🔧 To fix:');
    console.log('For local development:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings → API to get your keys');
    console.log('4. Go to Settings → Database to get your DATABASE_URL');
    console.log('5. Update your .env.local file with the correct values');
    console.log('\nFor Vercel deployment:');
    console.log('1. Go to your Vercel dashboard');
    console.log('2. Select your project → Settings → Environment Variables');
    console.log('3. Add the missing environment variables');
    process.exit(1);
  } else {
    console.log('\n🎉 All environment variables are properly configured!');
  }
}

// Main execution
validateEnv(); 