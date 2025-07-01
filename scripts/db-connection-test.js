#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Testing database connection...\n');

try {
  // Test 1: Check environment variables
  console.log('1. Checking environment variables...');
  const dbUrl = process.env.DATABASE_URL || require('fs').readFileSync('.env.local', 'utf8').match(/DATABASE_URL=(.+)/)?.[1];
  if (!dbUrl || dbUrl.includes('placeholder')) {
    console.log('❌ DATABASE_URL not found or contains placeholder values');
    process.exit(1);
  }
  console.log('✅ DATABASE_URL found\n');

  // Test 2: Extract hostname and test connectivity
  console.log('2. Testing network connectivity...');
  const hostname = dbUrl.match(/@([^:]+):/)?.[1];
  if (hostname) {
    try {
      execSync(`ping -c 3 ${hostname}`, { stdio: 'inherit' });
      console.log('✅ Database server is reachable\n');
    } catch (error) {
      console.log('❌ Cannot reach database server');
      console.log('🔧 Running troubleshooter...\n');
      execSync('npm run db:troubleshoot', { stdio: 'inherit' });
      process.exit(1);
    }
  }

  // Test 3: Try Prisma connection
  console.log('3. Testing Prisma connection...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.log('❌ Prisma connection failed');
    console.log('🔧 Running troubleshooter...\n');
    execSync('npm run db:troubleshoot', { stdio: 'inherit' });
    process.exit(1);
  }

} catch (error) {
  console.log('❌ Connection test failed:', error.message);
  console.log('🔧 Running troubleshooter...\n');
  execSync('npm run db:troubleshoot', { stdio: 'inherit' });
  process.exit(1);
} 