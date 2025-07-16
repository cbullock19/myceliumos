#!/usr/bin/env node

/**
 * ⏰ MYCELIUM OS BACKUP SCHEDULER
 * 
 * This system provides automated backup scheduling with:
 * - Daily, weekly, and monthly backup schedules
 * - Cloud storage integration (AWS S3, Google Cloud)
 * - Email notifications for backup status
 * - Backup rotation and retention management
 * - Health monitoring and alerting
 * 
 * Features:
 * - Cron-based scheduling
 * - Cloud storage backup
 * - Email notifications
 * - Backup verification
 * - Failure recovery
 */

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import backup system
const BackupSystem = require('./backup-system');
const DataIntegrityMonitor = require('./data-integrity-monitor');

class BackupScheduler {
  constructor() {
    this.backupSystem = new BackupSystem();
    this.integrityMonitor = new DataIntegrityMonitor();
    this.schedules = new Map();
    this.isRunning = false;
    
    // Email configuration
    this.emailConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };
    
    // Notification recipients
    this.notificationEmails = process.env.BACKUP_NOTIFICATION_EMAILS?.split(',') || [];
  }

  /**
   * 🚀 START SCHEDULER
   */
  async start() {
    console.log('⏰ Starting Mycelium OS Backup Scheduler...');
    
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }
    
    this.isRunning = true;
    
    // Schedule daily backups at 2 AM
    this.scheduleDailyBackup();
    
    // Schedule weekly backups on Sunday at 3 AM
    this.scheduleWeeklyBackup();
    
    // Schedule monthly backups on 1st of month at 4 AM
    this.scheduleMonthlyBackup();
    
    // Schedule integrity checks daily at 6 AM
    this.scheduleIntegrityCheck();
    
    console.log('✅ Backup scheduler started successfully');
    console.log('📅 Scheduled jobs:');
    console.log('   🗓️ Daily backup: 2:00 AM');
    console.log('   🗓️ Weekly backup: Sunday 3:00 AM');
    console.log('   🗓️ Monthly backup: 1st of month 4:00 AM');
    console.log('   🔍 Integrity check: 6:00 AM daily');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down backup scheduler...');
      this.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down backup scheduler...');
      this.stop();
      process.exit(0);
    });
  }

  /**
   * 🛑 STOP SCHEDULER
   */
  stop() {
    console.log('🛑 Stopping backup scheduler...');
    
    // Stop all scheduled jobs
    this.schedules.forEach((schedule, name) => {
      schedule.stop();
      console.log(`   🛑 Stopped: ${name}`);
    });
    
    this.schedules.clear();
    this.isRunning = false;
    console.log('✅ Backup scheduler stopped');
  }

  /**
   * 📅 SCHEDULE DAILY BACKUP
   */
  scheduleDailyBackup() {
    const schedule = cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Daily backup scheduled - starting...');
      await this.runScheduledBackup('daily');
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });
    
    this.schedules.set('daily-backup', schedule);
    schedule.start();
  }

  /**
   * 📅 SCHEDULE WEEKLY BACKUP
   */
  scheduleWeeklyBackup() {
    const schedule = cron.schedule('0 3 * * 0', async () => {
      console.log('🕐 Weekly backup scheduled - starting...');
      await this.runScheduledBackup('weekly');
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });
    
    this.schedules.set('weekly-backup', schedule);
    schedule.start();
  }

  /**
   * 📅 SCHEDULE MONTHLY BACKUP
   */
  scheduleMonthlyBackup() {
    const schedule = cron.schedule('0 4 1 * *', async () => {
      console.log('🕐 Monthly backup scheduled - starting...');
      await this.runScheduledBackup('monthly');
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });
    
    this.schedules.set('monthly-backup', schedule);
    schedule.start();
  }

  /**
   * 🔍 SCHEDULE INTEGRITY CHECK
   */
  scheduleIntegrityCheck() {
    const schedule = cron.schedule('0 6 * * *', async () => {
      console.log('🕐 Daily integrity check scheduled - starting...');
      await this.runScheduledIntegrityCheck();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });
    
    this.schedules.set('integrity-check', schedule);
    schedule.start();
  }

  /**
   * 🚀 RUN SCHEDULED BACKUP
   */
  async runScheduledBackup(type) {
    const startTime = new Date();
    const backupId = `${type}-backup-${startTime.toISOString().replace(/[:.]/g, '-')}`;
    
    console.log(`🚀 Starting ${type} backup: ${backupId}`);
    
    try {
      // Run backup
      const results = await this.backupSystem.runCompleteBackup();
      
      // Upload to cloud storage if configured
      await this.uploadToCloudStorage(results);
      
      // Run integrity check
      const integrityResults = await this.integrityMonitor.runCompleteCheck();
      
      // Send notification
      await this.sendBackupNotification({
        type,
        backupId,
        startTime,
        endTime: new Date(),
        results,
        integrityResults,
        success: true
      });
      
      console.log(`✅ ${type} backup completed successfully`);
      
    } catch (error) {
      console.error(`❌ ${type} backup failed:`, error.message);
      
      // Send failure notification
      await this.sendBackupNotification({
        type,
        backupId,
        startTime,
        endTime: new Date(),
        error: error.message,
        success: false
      });
    }
  }

  /**
   * 🔍 RUN SCHEDULED INTEGRITY CHECK
   */
  async runScheduledIntegrityCheck() {
    const startTime = new Date();
    const checkId = `integrity-check-${startTime.toISOString().replace(/[:.]/g, '-')}`;
    
    console.log(`🔍 Starting scheduled integrity check: ${checkId}`);
    
    try {
      const results = await this.integrityMonitor.runCompleteCheck();
      
      // Send notification if there are critical issues
      if (results.issues.length > 0) {
        await this.sendIntegrityNotification({
          checkId,
          startTime,
          endTime: new Date(),
          results,
          critical: true
        });
      }
      
      console.log(`✅ Scheduled integrity check completed`);
      
    } catch (error) {
      console.error(`❌ Scheduled integrity check failed:`, error.message);
      
      await this.sendIntegrityNotification({
        checkId,
        startTime,
        endTime: new Date(),
        error: error.message,
        critical: true
      });
    }
  }

  /**
   * ☁️ UPLOAD TO CLOUD STORAGE
   */
  async uploadToCloudStorage(backupResults) {
    // Check if cloud storage is configured
    if (!process.env.AWS_S3_BUCKET && !process.env.GOOGLE_CLOUD_BUCKET) {
      console.log('☁️ Cloud storage not configured - skipping upload');
      return;
    }
    
    console.log('☁️ Uploading backups to cloud storage...');
    
    try {
      if (process.env.AWS_S3_BUCKET) {
        await this.uploadToS3(backupResults);
      }
      
      if (process.env.GOOGLE_CLOUD_BUCKET) {
        await this.uploadToGoogleCloud(backupResults);
      }
      
      console.log('✅ Cloud storage upload completed');
      
    } catch (error) {
      console.error('❌ Cloud storage upload failed:', error.message);
      throw error;
    }
  }

  /**
   * 📧 SEND BACKUP NOTIFICATION
   */
  async sendBackupNotification(data) {
    if (this.notificationEmails.length === 0) {
      console.log('📧 No notification emails configured');
      return;
    }
    
    try {
      const transporter = nodemailer.createTransporter(this.emailConfig);
      
      const duration = Math.round((data.endTime - data.startTime) / 1000);
      const status = data.success ? '✅ SUCCESS' : '❌ FAILED';
      
      const subject = `[Mycelium OS] ${data.type.toUpperCase()} Backup - ${status}`;
      
      let html = `
        <h2>Mycelium OS Backup Report</h2>
        <p><strong>Type:</strong> ${data.type.toUpperCase()}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Duration:</strong> ${duration} seconds</p>
        <p><strong>Backup ID:</strong> ${data.backupId}</p>
        <p><strong>Started:</strong> ${data.startTime.toISOString()}</p>
        <p><strong>Completed:</strong> ${data.endTime.toISOString()}</p>
      `;
      
      if (data.success && data.results) {
        html += `
          <h3>Backup Results</h3>
          <ul>
            <li>Auth backup: ${data.results.auth ? '✅' : '❌'}</li>
            <li>Database backup: ${data.results.database ? '✅' : '❌'}</li>
            <li>Organizations backed up: ${data.results.organizations.length}</li>
            <li>Errors: ${data.results.errors.length}</li>
          </ul>
        `;
        
        if (data.integrityResults) {
          html += `
            <h3>Integrity Check Results</h3>
            <ul>
              <li>Passed checks: ${data.integrityResults.stats.passedChecks}/${data.integrityResults.stats.totalChecks}</li>
              <li>Critical issues: ${data.integrityResults.issues.length}</li>
              <li>Warnings: ${data.integrityResults.warnings.length}</li>
            </ul>
          `;
        }
      } else if (data.error) {
        html += `
          <h3>Error Details</h3>
          <p><strong>Error:</strong> ${data.error}</p>
        `;
      }
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'backups@myceliumos.app',
        to: this.notificationEmails.join(', '),
        subject,
        html
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`📧 Backup notification sent to ${this.notificationEmails.length} recipients`);
      
    } catch (error) {
      console.error('❌ Failed to send backup notification:', error.message);
    }
  }

  /**
   * 📧 SEND INTEGRITY NOTIFICATION
   */
  async sendIntegrityNotification(data) {
    if (this.notificationEmails.length === 0) {
      return;
    }
    
    try {
      const transporter = nodemailer.createTransporter(this.emailConfig);
      
      const subject = `[Mycelium OS] Data Integrity Alert - ${data.critical ? 'CRITICAL' : 'WARNING'}`;
      
      let html = `
        <h2>Mycelium OS Data Integrity Alert</h2>
        <p><strong>Check ID:</strong> ${data.checkId}</p>
        <p><strong>Status:</strong> ${data.critical ? '🚨 CRITICAL' : '⚠️ WARNING'}</p>
        <p><strong>Started:</strong> ${data.startTime.toISOString()}</p>
        <p><strong>Completed:</strong> ${data.endTime.toISOString()}</p>
      `;
      
      if (data.results) {
        html += `
          <h3>Integrity Check Results</h3>
          <ul>
            <li>Passed checks: ${data.results.stats.passedChecks}/${data.results.stats.totalChecks}</li>
            <li>Critical issues: ${data.results.issues.length}</li>
            <li>Warnings: ${data.results.warnings.length}</li>
          </ul>
        `;
        
        if (data.results.issues.length > 0) {
          html += '<h3>Critical Issues</h3><ul>';
          data.results.issues.forEach(issue => {
            html += `<li>[${issue.category}] ${issue.message}</li>`;
          });
          html += '</ul>';
        }
      } else if (data.error) {
        html += `
          <h3>Error Details</h3>
          <p><strong>Error:</strong> ${data.error}</p>
        `;
      }
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'alerts@myceliumos.app',
        to: this.notificationEmails.join(', '),
        subject,
        html
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`📧 Integrity notification sent to ${this.notificationEmails.length} recipients`);
      
    } catch (error) {
      console.error('❌ Failed to send integrity notification:', error.message);
    }
  }

  /**
   * 📊 GET SCHEDULER STATUS
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedules: Array.from(this.schedules.keys()),
      notificationEmails: this.notificationEmails,
      emailConfigured: !!(this.emailConfig.auth.user && this.emailConfig.auth.pass),
      cloudStorageConfigured: !!(process.env.AWS_S3_BUCKET || process.env.GOOGLE_CLOUD_BUCKET)
    };
  }

  /**
   * 🔄 MANUAL BACKUP TRIGGER
   */
  async triggerManualBackup(type = 'manual') {
    console.log(`🚀 Triggering manual ${type} backup...`);
    await this.runScheduledBackup(type);
  }

  /**
   * 🔍 MANUAL INTEGRITY CHECK TRIGGER
   */
  async triggerManualIntegrityCheck() {
    console.log('🔍 Triggering manual integrity check...');
    await this.runScheduledIntegrityCheck();
  }
}

// CLI Interface
async function main() {
  const scheduler = new BackupScheduler();
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  try {
    switch (command) {
      case 'start':
        await scheduler.start();
        break;
        
      case 'stop':
        scheduler.stop();
        break;
        
      case 'status':
        const status = scheduler.getStatus();
        console.log('📊 Backup Scheduler Status:');
        console.log(`   Running: ${status.isRunning ? '✅' : '❌'}`);
        console.log(`   Schedules: ${status.schedules.join(', ')}`);
        console.log(`   Email configured: ${status.emailConfigured ? '✅' : '❌'}`);
        console.log(`   Cloud storage: ${status.cloudStorageConfigured ? '✅' : '❌'}`);
        console.log(`   Notification emails: ${status.notificationEmails.length}`);
        break;
        
      case 'backup':
        await scheduler.triggerManualBackup(args[0] || 'manual');
        break;
        
      case 'check':
        await scheduler.triggerManualIntegrityCheck();
        break;
        
      default:
        console.log(`
⏰ MYCELIUM OS BACKUP SCHEDULER

Usage:
  node scripts/backup-scheduler.js <command> [options]

Commands:
  start                    Start the backup scheduler
  stop                     Stop the backup scheduler
  status                   Show scheduler status
  backup [type]           Trigger manual backup
  check                    Trigger manual integrity check

Examples:
  node scripts/backup-scheduler.js start
  node scripts/backup-scheduler.js status
  node scripts/backup-scheduler.js backup daily
  node scripts/backup-scheduler.js check

Environment Variables:
  SMTP_HOST               SMTP server hostname
  SMTP_PORT               SMTP server port (default: 587)
  SMTP_SECURE             Use SSL/TLS (true/false)
  SMTP_USER               SMTP username
  SMTP_PASS               SMTP password
  FROM_EMAIL              Sender email address
  BACKUP_NOTIFICATION_EMAILS  Comma-separated list of notification emails
  AWS_S3_BUCKET          AWS S3 bucket for cloud storage
  GOOGLE_CLOUD_BUCKET    Google Cloud Storage bucket
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = BackupScheduler; 