#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up database connection...\n');

// Helper function to run commands with proper error handling
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000 // 30 second timeout
    });
    console.log(`✅ ${description} completed`);
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(`   Error: ${error.message}`);
    if (error.stdout) {
      console.error(`   Stdout: ${error.stdout}`);
    }
    if (error.stderr) {
      console.error(`   Stderr: ${error.stderr}`);
    }
    return false;
  }
}

// Test database connection
function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');
  
  // Try to connect to database
  const connected = runCommand('npx prisma db pull --force', 'Testing database connectivity');
  
  if (!connected) {
    console.error('\n💥 Database connection failed!');
    console.error('\n🔧 Please check:');
    console.error('1. Your Supabase project is active (not paused)');
    console.error('2. DATABASE_URL in .env is correct');
    console.error('3. Your database password is current');
    console.error('\n📋 Steps to fix:');
    console.error('1. Go to https://supabase.com/dashboard');
    console.error('2. Check if your project is paused - if so, unpause it');
    console.error('3. Go to Settings → Database → Connection pooling');
    console.error('4. Copy the connection string to your .env file');
    console.error('5. Run this script again');
    return false;
  }
  
  return true;
}

// Initialize database schema
function initializeDatabase() {
  console.log('\n🏗️  Initializing database schema...\n');
  
  // Generate Prisma client
  if (!runCommand('npx prisma generate', 'Generating Prisma client')) {
    return false;
  }
  
  // Push schema to database
  if (!runCommand('npx prisma db push --force-reset', 'Pushing schema to database')) {
    return false;
  }
  
  console.log('\n🎉 Database schema initialized successfully!');
  return true;
}

// Create seed data (optional)
function createSeedData() {
  console.log('\n🌱 Setting up seed data...\n');
  
  // Check if seed script exists
  const seedScriptExists = fs.existsSync('prisma/seed.js') || fs.existsSync('prisma/seed.ts');
  
  if (seedScriptExists) {
    console.log('📋 Found seed script, running...');
    return runCommand('npx prisma db seed', 'Running database seed');
  } else {
    console.log('ℹ️  No seed script found, skipping seed data creation');
    return true;
  }
}

// Verify setup
function verifySetup() {
  console.log('\n🔍 Verifying database setup...\n');
  
  // Try a simple query to verify everything works
  const verifyScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection verified');
    
    // Check if tables exist
    const result = await prisma.$queryRaw\`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'\`;
    console.log('✅ Tables found:', result.length);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

verify().then(success => process.exit(success ? 0 : 1));
`;
  
  // Write temporary verification script
  fs.writeFileSync('temp-verify.js', verifyScript);
  
  try {
    const success = runCommand('node temp-verify.js', 'Verifying database connection');
    fs.unlinkSync('temp-verify.js'); // Clean up
    return success;
  } catch (error) {
    if (fs.existsSync('temp-verify.js')) {
      fs.unlinkSync('temp-verify.js'); // Clean up on error
    }
    return false;
  }
}

// Main setup process
async function setupDatabase() {
  console.log('🎯 Starting comprehensive database setup...\n');
  
  // Step 1: Test connection
  if (!testDatabaseConnection()) {
    process.exit(1);
  }
  
  // Step 2: Initialize database
  if (!initializeDatabase()) {
    console.error('\n💥 Database initialization failed!');
    process.exit(1);
  }
  
  // Step 3: Create seed data (optional)
  createSeedData();
  
  // Step 4: Verify setup
  if (!verifySetup()) {
    console.error('\n💥 Database verification failed!');
    process.exit(1);
  }
  
  console.log('\n🎉 Database setup completed successfully!');
  console.log('\n🚀 You can now start your development server with: npm run dev');
}

// Run setup
setupDatabase().catch(error => {
  console.error('\n💥 Setup failed with error:', error);
  process.exit(1);
}); 