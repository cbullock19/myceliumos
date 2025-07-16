#!/usr/bin/env node

/**
 * 🚀 MYCELIUM OS BACKUP SYSTEM SETUP
 * 
 * This script helps you quickly set up the backup and disaster recovery system:
 * - Validates environment configuration
 * - Tests backup functionality
 * - Configures automated scheduling
 * - Sets up monitoring and alerts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

class BackupSystemSetup {
  constructor() {
    this.setupSteps = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Add setup step result
   */
  addStep(step, status, message, details = null) {
    this.setupSteps.push({
      step,
      status, // 'success', 'error', 'warning'
      message,
      details,
      timestamp: new Date().toISOString()
    });
    
    if (status === 'error') {
      this.errors.push({ step, message, details });
    } else if (status === 'warning') {
      this.warnings.push({ step, message, details });
    }
  }

  /**
   * 🔍 VALIDATE ENVIRONMENT CONFIGURATION
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment configuration...');
    
    const requiredVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const optionalVars = [
      'BACKUP_NOTIFICATION_EMAILS',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'AWS_S3_BUCKET',
      'GOOGLE_CLOUD_BUCKET'
    ];
    
    let hasErrors = false;
    
    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        this.addStep('environment', 'error', `${varName} is missing`);
        hasErrors = true;
      } else if (value.includes('placeholder') || value.includes('your_')) {
        this.addStep('environment', 'error', `${varName} has placeholder value`);
        hasErrors = true;
      } else {
        this.addStep('environment', 'success', `${varName} is configured`);
      }
    }
    
    // Check optional variables
    let optionalConfigured = 0;
    for (const varName of optionalVars) {
      const value = process.env[varName];
      if (value && !value.includes('placeholder')) {
        optionalConfigured++;
        this.addStep('environment', 'success', `${varName} is configured`);
      } else {
        this.addStep('environment', 'warning', `${varName} is not configured (optional)`);
      }
    }
    
    console.log(`✅ Environment validation completed`);
    console.log(`   📊 Required vars: ${requiredVars.length - (hasErrors ? 1 : 0)}/${requiredVars.length}`);
    console.log(`   📊 Optional vars: ${optionalConfigured}/${optionalVars.length}`);
    
    return !hasErrors;
  }

  /**
   * 🗄️ TEST DATABASE CONNECTION
   */
  async testDatabaseConnection() {
    console.log('🗄️ Testing database connection...');
    
    try {
      // Test Prisma connection
      execSync('npm run db:check', { stdio: 'pipe' });
      this.addStep('database', 'success', 'Database connection successful');
      
      console.log('✅ Database connection test passed');
      return true;
      
    } catch (error) {
      this.addStep('database', 'error', 'Database connection failed', error.message);
      console.error('❌ Database connection test failed');
      return false;
    }
  }

  /**
   * 🔐 TEST SUPABASE AUTH CONNECTION
   */
  async testSupabaseAuth() {
    console.log('🔐 Testing Supabase Auth connection...');
    
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Test auth connection
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        throw new Error(error.message);
      }
      
      this.addStep('supabase-auth', 'success', 'Supabase Auth connection successful');
      console.log(`✅ Supabase Auth test passed (${data.users.length} users found)`);
      return true;
      
    } catch (error) {
      this.addStep('supabase-auth', 'error', 'Supabase Auth connection failed', error.message);
      console.error('❌ Supabase Auth test failed');
      return false;
    }
  }

  /**
   * 📦 INSTALL DEPENDENCIES
   */
  async installDependencies() {
    console.log('📦 Installing backup system dependencies...');
    
    try {
      // Check if dependencies are already installed
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredDeps = ['node-cron', 'nodemailer', 'dotenv'];
      
      let missingDeps = [];
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
          missingDeps.push(dep);
        }
      }
      
      if (missingDeps.length > 0) {
        console.log(`📦 Installing missing dependencies: ${missingDeps.join(', ')}`);
        execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      }
      
      this.addStep('dependencies', 'success', 'All dependencies installed');
      console.log('✅ Dependencies installation completed');
      return true;
      
    } catch (error) {
      this.addStep('dependencies', 'error', 'Dependencies installation failed', error.message);
      console.error('❌ Dependencies installation failed');
      return false;
    }
  }

  /**
   * 🛡️ TEST BACKUP FUNCTIONALITY
   */
  async testBackupFunctionality() {
    console.log('🛡️ Testing backup functionality...');
    
    try {
      // Test backup system
      const BackupSystem = require('./backup-system');
      const backupSystem = new BackupSystem();
      
      // Test auth backup
      console.log('   🔐 Testing auth backup...');
      await backupSystem.backupAuthUsers();
      
      // Test database backup
      console.log('   🗄️ Testing database backup...');
      await backupSystem.backupDatabase();
      
      // Test integrity monitor
      console.log('   🔍 Testing integrity monitor...');
      const DataIntegrityMonitor = require('./data-integrity-monitor');
      const monitor = new DataIntegrityMonitor();
      await monitor.runCompleteCheck();
      
      this.addStep('backup-test', 'success', 'Backup functionality test passed');
      console.log('✅ Backup functionality test completed');
      return true;
      
    } catch (error) {
      this.addStep('backup-test', 'error', 'Backup functionality test failed', error.message);
      console.error('❌ Backup functionality test failed');
      return false;
    }
  }

  /**
   * 📧 TEST EMAIL NOTIFICATIONS
   */
  async testEmailNotifications() {
    console.log('📧 Testing email notifications...');
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.addStep('email-test', 'warning', 'Email notifications not configured');
      console.log('⚠️ Email notifications not configured (optional)');
      return true;
    }
    
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      // Test email connection
      await transporter.verify();
      
      this.addStep('email-test', 'success', 'Email notifications configured');
      console.log('✅ Email notifications test passed');
      return true;
      
    } catch (error) {
      this.addStep('email-test', 'error', 'Email notifications test failed', error.message);
      console.error('❌ Email notifications test failed');
      return false;
    }
  }

  /**
   * ⏰ TEST SCHEDULER FUNCTIONALITY
   */
  async testSchedulerFunctionality() {
    console.log('⏰ Testing scheduler functionality...');
    
    try {
      const BackupScheduler = require('./backup-scheduler');
      const scheduler = new BackupScheduler();
      
      // Test scheduler status
      const status = scheduler.getStatus();
      
      if (status.emailConfigured) {
        this.addStep('scheduler-test', 'success', 'Scheduler configured with email notifications');
      } else {
        this.addStep('scheduler-test', 'warning', 'Scheduler configured without email notifications');
      }
      
      console.log('✅ Scheduler functionality test completed');
      return true;
      
    } catch (error) {
      this.addStep('scheduler-test', 'error', 'Scheduler functionality test failed', error.message);
      console.error('❌ Scheduler functionality test failed');
      return false;
    }
  }

  /**
   * 📁 CREATE BACKUP DIRECTORIES
   */
  async createBackupDirectories() {
    console.log('📁 Creating backup directories...');
    
    try {
      const dirs = [
        'backups',
        'backups/auth',
        'backups/database',
        'backups/organizations',
        'reports'
      ];
      
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`   📁 Created: ${dir}`);
        }
      }
      
      this.addStep('directories', 'success', 'Backup directories created');
      console.log('✅ Backup directories setup completed');
      return true;
      
    } catch (error) {
      this.addStep('directories', 'error', 'Failed to create backup directories', error.message);
      console.error('❌ Backup directories setup failed');
      return false;
    }
  }

  /**
   * 📄 CREATE CONFIGURATION FILES
   */
  async createConfigurationFiles() {
    console.log('📄 Creating configuration files...');
    
    try {
      // Create .gitignore entries for backups
      const gitignorePath = '.gitignore';
      let gitignoreContent = '';
      
      if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      }
      
      const backupEntries = [
        '',
        '# Backup System',
        'backups/',
        'reports/',
        '*.backup',
        '*.sql',
        'backup-*.json'
      ];
      
      for (const entry of backupEntries) {
        if (!gitignoreContent.includes(entry)) {
          gitignoreContent += entry + '\n';
        }
      }
      
      fs.writeFileSync(gitignorePath, gitignoreContent);
      
      this.addStep('config-files', 'success', 'Configuration files created');
      console.log('✅ Configuration files setup completed');
      return true;
      
    } catch (error) {
      this.addStep('config-files', 'error', 'Failed to create configuration files', error.message);
      console.error('❌ Configuration files setup failed');
      return false;
    }
  }

  /**
   * 📊 GENERATE SETUP REPORT
   */
  async generateSetupReport() {
    console.log('📊 Generating setup report...');
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalSteps: this.setupSteps.length,
          successfulSteps: this.setupSteps.filter(s => s.status === 'success').length,
          failedSteps: this.setupSteps.filter(s => s.status === 'error').length,
          warnings: this.setupSteps.filter(s => s.status === 'warning').length
        },
        steps: this.setupSteps,
        errors: this.errors,
        warnings: this.warnings,
        recommendations: this.generateRecommendations()
      };
      
      // Write report
      const reportFile = `reports/setup-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      console.log(`📄 Setup report saved: ${reportFile}`);
      
      // Display summary
      console.log('\n📊 Setup Summary:');
      console.log(`   ✅ Successful: ${report.summary.successfulSteps}`);
      console.log(`   ❌ Failed: ${report.summary.failedSteps}`);
      console.log(`   ⚠️ Warnings: ${report.summary.warnings}`);
      
      if (this.errors.length > 0) {
        console.log('\n❌ Errors to fix:');
        this.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. [${error.step}] ${error.message}`);
        });
      }
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        this.warnings.forEach((warning, index) => {
          console.log(`   ${index + 1}. [${warning.step}] ${warning.message}`);
        });
      }
      
      return report;
      
    } catch (error) {
      console.error('❌ Report generation failed:', error.message);
      throw error;
    }
  }

  /**
   * 💡 GENERATE RECOMMENDATIONS
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check for missing email configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      recommendations.push({
        priority: 'medium',
        category: 'email',
        action: 'Configure email notifications for backup alerts',
        details: 'Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env.local'
      });
    }
    
    // Check for missing cloud storage
    if (!process.env.AWS_S3_BUCKET && !process.env.GOOGLE_CLOUD_BUCKET) {
      recommendations.push({
        priority: 'high',
        category: 'cloud-storage',
        action: 'Set up cloud storage for off-site backups',
        details: 'Configure AWS_S3_BUCKET or GOOGLE_CLOUD_BUCKET for secure backup storage'
      });
    }
    
    // Check for missing notification emails
    if (!process.env.BACKUP_NOTIFICATION_EMAILS) {
      recommendations.push({
        priority: 'medium',
        category: 'notifications',
        action: 'Configure backup notification emails',
        details: 'Add BACKUP_NOTIFICATION_EMAILS to .env.local'
      });
    }
    
    return recommendations;
  }

  /**
   * 🚀 RUN COMPLETE SETUP
   */
  async runCompleteSetup() {
    console.log('🚀 Starting Mycelium OS Backup System Setup...\n');
    
    try {
      // Run all setup steps
      const steps = [
        { name: 'Environment Validation', fn: () => this.validateEnvironment() },
        { name: 'Dependencies Installation', fn: () => this.installDependencies() },
        { name: 'Database Connection Test', fn: () => this.testDatabaseConnection() },
        { name: 'Supabase Auth Test', fn: () => this.testSupabaseAuth() },
        { name: 'Backup Directories Creation', fn: () => this.createBackupDirectories() },
        { name: 'Configuration Files Setup', fn: () => this.createConfigurationFiles() },
        { name: 'Backup Functionality Test', fn: () => this.testBackupFunctionality() },
        { name: 'Email Notifications Test', fn: () => this.testEmailNotifications() },
        { name: 'Scheduler Functionality Test', fn: () => this.testSchedulerFunctionality() }
      ];
      
      for (const step of steps) {
        console.log(`\n🔄 Running: ${step.name}`);
        await step.fn();
      }
      
      // Generate final report
      await this.generateSetupReport();
      
      console.log('\n🎉 Setup completed!');
      
      if (this.errors.length === 0) {
        console.log('✅ All tests passed - backup system is ready!');
        console.log('\n📋 Next steps:');
        console.log('   1. Run your first backup: npm run backup');
        console.log('   2. Start the scheduler: npm run scheduler-start');
        console.log('   3. Check integrity: npm run integrity-check');
        console.log('   4. Review the setup report in reports/');
      } else {
        console.log('⚠️ Setup completed with errors - please fix the issues above');
      }
      
      return {
        success: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings
      };
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const setup = new BackupSystemSetup();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'setup':
        await setup.runCompleteSetup();
        break;
        
      case 'test':
        console.log('🧪 Running backup system tests...');
        await setup.testBackupFunctionality();
        break;
        
      case 'validate':
        console.log('🔍 Validating environment...');
        await setup.validateEnvironment();
        break;
        
      default:
        console.log(`
🚀 MYCELIUM OS BACKUP SYSTEM SETUP

Usage:
  node scripts/setup-backup-system.js <command>

Commands:
  setup                    Run complete setup
  test                     Test backup functionality
  validate                 Validate environment configuration

Examples:
  node scripts/setup-backup-system.js setup
  node scripts/setup-backup-system.js test
  node scripts/setup-backup-system.js validate

This script will:
✅ Validate environment configuration
✅ Install required dependencies
✅ Test database and auth connections
✅ Create backup directories
✅ Test backup functionality
✅ Configure email notifications
✅ Set up automated scheduling
✅ Generate setup report
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = BackupSystemSetup; 