#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

// Check if file exists and read it
function readEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return vars;
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return null;
  }
}

// Validate environment variables
function validateEnv() {
  let hasErrors = false;
  
  // Check both .env and .env.local files
  const envFiles = ['.env', '.env.local'];
  const allVars = {};
  
  envFiles.forEach(filename => {
    const vars = readEnvFile(filename);
    if (vars) {
      console.log(`✅ Found ${filename} with ${Object.keys(vars).length} variables`);
      Object.assign(allVars, vars);
    } else {
      console.log(`⚠️  File ${filename} not found or unreadable`);
    }
  });
  
  console.log('\n📋 Checking required variables:');
  
  Object.entries(requiredVars).forEach(([varName, config]) => {
    const value = allVars[varName];
    
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
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings → API to get your keys');
    console.log('4. Go to Settings → Database to get your DATABASE_URL');
    console.log('5. Update your .env.local file with the correct values');
    process.exit(1);
  } else {
    console.log('\n🎉 All environment variables are properly configured!');
  }
}

// Backup current env files
function backupEnvFiles() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  ['.env', '.env.local'].forEach(filename => {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(process.cwd(), `${filename}.backup.${timestamp}`);
      fs.copyFileSync(filePath, backupPath);
      console.log(`💾 Backed up ${filename} to ${filename}.backup.${timestamp}`);
    }
  });
}

// Main execution
if (process.argv.includes('--backup')) {
  backupEnvFiles();
}

validateEnv(); 