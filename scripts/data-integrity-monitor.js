#!/usr/bin/env node

/**
 * 🔍 MYCELIUM OS DATA INTEGRITY MONITOR
 * 
 * This system monitors data integrity across:
 * - Supabase Auth ↔ Database user consistency
 * - Organization data isolation
 * - Referential integrity
 * - Orphaned records
 * - Data validation rules
 * 
 * Features:
 * - Automated integrity checks
 * - Detailed reporting
 * - Alert system for issues
 * - Data repair suggestions
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class DataIntegrityMonitor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.stats = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      warnings: 0
    };
  }

  /**
   * Add issue to tracking
   */
  addIssue(severity, category, message, details = {}) {
    const issue = {
      severity, // 'error', 'warning', 'info'
      category,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    if (severity === 'error') {
      this.issues.push(issue);
    } else {
      this.warnings.push(issue);
    }
    
    this.stats.failedChecks++;
  }

  /**
   * 🔐 CHECK AUTH ↔ DATABASE USER CONSISTENCY
   */
  async checkAuthDatabaseConsistency() {
    console.log('🔐 Checking Auth ↔ Database user consistency...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Get all Supabase Auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Failed to fetch auth users: ${authError.message}`);
      }
      
      // Get all database users
      const dbUsers = await prisma.user.findMany({
        include: {
          organization: true
        }
      });
      
      // Check for auth users without database records
      const authUserIds = authUsers.users.map(u => u.id);
      const dbUserIds = dbUsers.map(u => u.id);
      
      const orphanedAuthUsers = authUserIds.filter(id => !dbUserIds.includes(id));
      const orphanedDbUsers = dbUserIds.filter(id => !authUserIds.includes(id));
      
      if (orphanedAuthUsers.length > 0) {
        this.addIssue('error', 'auth-consistency', 
          `${orphanedAuthUsers.length} auth users without database records`,
          { orphanedAuthUsers }
        );
      }
      
      if (orphanedDbUsers.length > 0) {
        this.addIssue('error', 'auth-consistency',
          `${orphanedDbUsers.length} database users without auth records`,
          { orphanedDbUsers }
        );
      }
      
      // Check email consistency
      const emailMismatches = [];
      for (const authUser of authUsers.users) {
        const dbUser = dbUsers.find(u => u.id === authUser.id);
        if (dbUser && dbUser.email !== authUser.email) {
          emailMismatches.push({
            userId: authUser.id,
            authEmail: authUser.email,
            dbEmail: dbUser.email
          });
        }
      }
      
      if (emailMismatches.length > 0) {
        this.addIssue('warning', 'auth-consistency',
          `${emailMismatches.length} users with email mismatches`,
          { emailMismatches }
        );
      }
      
      console.log(`✅ Auth consistency check completed`);
      console.log(`   📊 Auth users: ${authUsers.users.length}`);
      console.log(`   📊 Database users: ${dbUsers.length}`);
      console.log(`   ❌ Orphaned auth users: ${orphanedAuthUsers.length}`);
      console.log(`   ❌ Orphaned db users: ${orphanedDbUsers.length}`);
      console.log(`   ⚠️ Email mismatches: ${emailMismatches.length}`);
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.error('❌ Auth consistency check failed:', error.message);
      this.addIssue('error', 'auth-consistency', error.message);
    }
  }

  /**
   * 🏢 CHECK ORGANIZATION DATA ISOLATION
   */
  async checkOrganizationIsolation() {
    console.log('🏢 Checking organization data isolation...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Get all organizations
      const organizations = await prisma.organization.findMany({
        include: {
          users: true,
          clients: true,
          deliverables: true,
          projects: true
        }
      });
      
      // Check for cross-organization data leaks
      const isolationIssues = [];
      
      for (const org of organizations) {
        // Check if any users reference wrong organization
        const misassignedUsers = org.users.filter(user => 
          user.organizationId !== org.id
        );
        
        if (misassignedUsers.length > 0) {
          isolationIssues.push({
            organizationId: org.id,
            organizationName: org.name,
            type: 'user-isolation',
            count: misassignedUsers.length,
            details: misassignedUsers.map(u => ({ id: u.id, email: u.email }))
          });
        }
        
        // Check if any clients reference wrong organization
        const misassignedClients = org.clients.filter(client => 
          client.organizationId !== org.id
        );
        
        if (misassignedClients.length > 0) {
          isolationIssues.push({
            organizationId: org.id,
            organizationName: org.name,
            type: 'client-isolation',
            count: misassignedClients.length,
            details: misassignedClients.map(c => ({ id: c.id, name: c.name }))
          });
        }
      }
      
      if (isolationIssues.length > 0) {
        this.addIssue('error', 'organization-isolation',
          `${isolationIssues.length} organization isolation violations`,
          { isolationIssues }
        );
      }
      
      console.log(`✅ Organization isolation check completed`);
      console.log(`   📊 Organizations: ${organizations.length}`);
      console.log(`   ❌ Isolation violations: ${isolationIssues.length}`);
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.error('❌ Organization isolation check failed:', error.message);
      this.addIssue('error', 'organization-isolation', error.message);
    }
  }

  /**
   * 🔗 CHECK REFERENTIAL INTEGRITY
   */
  async checkReferentialIntegrity() {
    console.log('🔗 Checking referential integrity...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const integrityIssues = [];
      
      // Check for orphaned deliverables (no organization)
      const orphanedDeliverables = await prisma.deliverable.findMany({
        where: {
          organization: null
        }
      });
      
      if (orphanedDeliverables.length > 0) {
        integrityIssues.push({
          type: 'orphaned-deliverables',
          count: orphanedDeliverables.length,
          details: orphanedDeliverables.map(d => ({ id: d.id, title: d.title }))
        });
      }
      
      // Check for orphaned clients (no organization)
      const orphanedClients = await prisma.client.findMany({
        where: {
          organization: null
        }
      });
      
      if (orphanedClients.length > 0) {
        integrityIssues.push({
          type: 'orphaned-clients',
          count: orphanedClients.length,
          details: orphanedClients.map(c => ({ id: c.id, name: c.name }))
        });
      }
      
      // Check for deliverables with invalid service types
      const deliverablesWithInvalidServiceTypes = await prisma.deliverable.findMany({
        where: {
          serviceType: null
        }
      });
      
      if (deliverablesWithInvalidServiceTypes.length > 0) {
        integrityIssues.push({
          type: 'invalid-service-types',
          count: deliverablesWithInvalidServiceTypes.length,
          details: deliverablesWithInvalidServiceTypes.map(d => ({ id: d.id, title: d.title }))
        });
      }
      
      // Check for comments with invalid users
      const commentsWithInvalidUsers = await prisma.comment.findMany({
        where: {
          user: null
        }
      });
      
      if (commentsWithInvalidUsers.length > 0) {
        integrityIssues.push({
          type: 'invalid-comment-users',
          count: commentsWithInvalidUsers.length,
          details: commentsWithInvalidUsers.map(c => ({ id: c.id, content: c.content.substring(0, 50) }))
        });
      }
      
      if (integrityIssues.length > 0) {
        this.addIssue('error', 'referential-integrity',
          `${integrityIssues.length} referential integrity violations`,
          { integrityIssues }
        );
      }
      
      console.log(`✅ Referential integrity check completed`);
      console.log(`   ❌ Orphaned deliverables: ${orphanedDeliverables.length}`);
      console.log(`   ❌ Orphaned clients: ${orphanedClients.length}`);
      console.log(`   ❌ Invalid service types: ${deliverablesWithInvalidServiceTypes.length}`);
      console.log(`   ❌ Invalid comment users: ${commentsWithInvalidUsers.length}`);
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.error('❌ Referential integrity check failed:', error.message);
      this.addIssue('error', 'referential-integrity', error.message);
    }
  }

  /**
   * 📊 CHECK DATA VALIDATION RULES
   */
  async checkDataValidation() {
    console.log('📊 Checking data validation rules...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const validationIssues = [];
      
      // Check for users with invalid email formats
      const usersWithInvalidEmails = await prisma.user.findMany({
        where: {
          email: {
            not: {
              contains: '@'
            }
          }
        }
      });
      
      if (usersWithInvalidEmails.length > 0) {
        validationIssues.push({
          type: 'invalid-emails',
          count: usersWithInvalidEmails.length,
          details: usersWithInvalidEmails.map(u => ({ id: u.id, email: u.email }))
        });
      }
      
      // Check for organizations with duplicate slugs
      const duplicateSlugs = await prisma.$queryRaw`
        SELECT slug, COUNT(*) as count
        FROM organizations
        GROUP BY slug
        HAVING COUNT(*) > 1
      `;
      
      if (duplicateSlugs.length > 0) {
        validationIssues.push({
          type: 'duplicate-slugs',
          count: duplicateSlugs.length,
          details: duplicateSlugs
        });
      }
      
      // Check for deliverables with past due dates but not completed
      const overdueDeliverables = await prisma.deliverable.findMany({
        where: {
          dueDate: {
            lt: new Date()
          },
          status: {
            not: 'COMPLETED'
          }
        }
      });
      
      if (overdueDeliverables.length > 0) {
        validationIssues.push({
          type: 'overdue-deliverables',
          count: overdueDeliverables.length,
          details: overdueDeliverables.map(d => ({ 
            id: d.id, 
            title: d.title, 
            dueDate: d.dueDate 
          }))
        });
      }
      
      // Check for empty required fields
      const usersWithoutNames = await prisma.user.findMany({
        where: {
          OR: [
            { name: null },
            { name: '' }
          ]
        }
      });
      
      if (usersWithoutNames.length > 0) {
        validationIssues.push({
          type: 'empty-required-fields',
          count: usersWithoutNames.length,
          details: usersWithoutNames.map(u => ({ id: u.id, email: u.email }))
        });
      }
      
      if (validationIssues.length > 0) {
        this.addIssue('warning', 'data-validation',
          `${validationIssues.length} data validation issues`,
          { validationIssues }
        );
      }
      
      console.log(`✅ Data validation check completed`);
      console.log(`   ⚠️ Invalid emails: ${usersWithInvalidEmails.length}`);
      console.log(`   ⚠️ Duplicate slugs: ${duplicateSlugs.length}`);
      console.log(`   ⚠️ Overdue deliverables: ${overdueDeliverables.length}`);
      console.log(`   ⚠️ Empty required fields: ${usersWithoutNames.length}`);
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.error('❌ Data validation check failed:', error.message);
      this.addIssue('error', 'data-validation', error.message);
    }
  }

  /**
   * 📈 CHECK PERFORMANCE METRICS
   */
  async checkPerformanceMetrics() {
    console.log('📈 Checking performance metrics...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Get database statistics
      const stats = {
        organizations: await prisma.organization.count(),
        users: await prisma.user.count(),
        clients: await prisma.client.count(),
        deliverables: await prisma.deliverable.count(),
        projects: await prisma.project.count(),
        comments: await prisma.comment.count()
      };
      
      // Check for performance issues
      const performanceIssues = [];
      
      // Large organizations (potential performance impact)
      const largeOrganizations = await prisma.organization.findMany({
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              deliverables: true
            }
          }
        }
      });
      
      const oversizedOrgs = largeOrganizations.filter(org => 
        org._count.users > 100 || 
        org._count.clients > 50 || 
        org._count.deliverables > 1000
      );
      
      if (oversizedOrgs.length > 0) {
        performanceIssues.push({
          type: 'large-organizations',
          count: oversizedOrgs.length,
          details: oversizedOrgs.map(org => ({
            id: org.id,
            name: org.name,
            users: org._count.users,
            clients: org._count.clients,
            deliverables: org._count.deliverables
          }))
        });
      }
      
      // Check for organizations with many overdue deliverables
      const orgsWithOverdueDeliverables = await prisma.organization.findMany({
        include: {
          deliverables: {
            where: {
              dueDate: {
                lt: new Date()
              },
              status: {
                not: 'COMPLETED'
              }
            }
          }
        }
      });
      
      const orgsWithManyOverdue = orgsWithOverdueDeliverables.filter(org => 
        org.deliverables.length > 10
      );
      
      if (orgsWithManyOverdue.length > 0) {
        performanceIssues.push({
          type: 'organizations-with-many-overdue',
          count: orgsWithManyOverdue.length,
          details: orgsWithManyOverdue.map(org => ({
            id: org.id,
            name: org.name,
            overdueCount: org.deliverables.length
          }))
        });
      }
      
      if (performanceIssues.length > 0) {
        this.addIssue('warning', 'performance',
          `${performanceIssues.length} performance concerns`,
          { performanceIssues }
        );
      }
      
      console.log(`✅ Performance metrics check completed`);
      console.log(`   📊 Total organizations: ${stats.organizations}`);
      console.log(`   📊 Total users: ${stats.users}`);
      console.log(`   📊 Total clients: ${stats.clients}`);
      console.log(`   📊 Total deliverables: ${stats.deliverables}`);
      console.log(`   ⚠️ Large organizations: ${oversizedOrgs.length}`);
      console.log(`   ⚠️ Orgs with many overdue: ${orgsWithManyOverdue.length}`);
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.error('❌ Performance metrics check failed:', error.message);
      this.addIssue('error', 'performance', error.message);
    }
  }

  /**
   * 🔍 RUN COMPLETE INTEGRITY CHECK
   */
  async runCompleteCheck() {
    console.log('🔍 Starting complete data integrity check...\n');
    
    this.stats.totalChecks = 5; // Number of check categories
    
    try {
      // Run all checks
      await this.checkAuthDatabaseConsistency();
      await this.checkOrganizationIsolation();
      await this.checkReferentialIntegrity();
      await this.checkDataValidation();
      await this.checkPerformanceMetrics();
      
      // Calculate stats
      this.stats.passedChecks = this.stats.totalChecks - this.stats.failedChecks;
      this.stats.warnings = this.warnings.length;
      
      // Generate report
      await this.generateIntegrityReport();
      
      console.log('\n✅ Complete integrity check finished!');
      console.log(`📊 Results:`);
      console.log(`   ✅ Passed checks: ${this.stats.passedChecks}/${this.stats.totalChecks}`);
      console.log(`   ❌ Failed checks: ${this.stats.failedChecks}`);
      console.log(`   ⚠️ Warnings: ${this.stats.warnings}`);
      console.log(`   🚨 Critical issues: ${this.issues.length}`);
      
      if (this.issues.length > 0) {
        console.log('\n🚨 Critical Issues Found:');
        this.issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. [${issue.category}] ${issue.message}`);
        });
      }
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        this.warnings.forEach((warning, index) => {
          console.log(`   ${index + 1}. [${warning.category}] ${warning.message}`);
        });
      }
      
      return {
        stats: this.stats,
        issues: this.issues,
        warnings: this.warnings
      };
      
    } catch (error) {
      console.error('❌ Complete integrity check failed:', error.message);
      throw error;
    }
  }

  /**
   * 📄 GENERATE INTEGRITY REPORT
   */
  async generateIntegrityReport() {
    console.log('📄 Generating integrity report...');
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalChecks: this.stats.totalChecks,
          passedChecks: this.stats.passedChecks,
          failedChecks: this.stats.failedChecks,
          warnings: this.stats.warnings,
          criticalIssues: this.issues.length
        },
        issues: this.issues,
        warnings: this.warnings,
        recommendations: this.generateRecommendations()
      };
      
      // Create reports directory
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      // Write report
      const reportFile = path.join(reportsDir, `integrity-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      console.log(`📄 Integrity report saved: ${reportFile}`);
      
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
    
    // Auth consistency recommendations
    const authIssues = this.issues.filter(i => i.category === 'auth-consistency');
    if (authIssues.length > 0) {
      recommendations.push({
        category: 'auth-consistency',
        priority: 'high',
        action: 'Run user synchronization script to align auth and database users',
        script: 'node scripts/sync-auth-users.js'
      });
    }
    
    // Organization isolation recommendations
    const isolationIssues = this.issues.filter(i => i.category === 'organization-isolation');
    if (isolationIssues.length > 0) {
      recommendations.push({
        category: 'organization-isolation',
        priority: 'critical',
        action: 'Review and fix cross-organization data leaks immediately',
        script: 'node scripts/fix-organization-isolation.js'
      });
    }
    
    // Referential integrity recommendations
    const integrityIssues = this.issues.filter(i => i.category === 'referential-integrity');
    if (integrityIssues.length > 0) {
      recommendations.push({
        category: 'referential-integrity',
        priority: 'high',
        action: 'Clean up orphaned records and fix broken references',
        script: 'node scripts/cleanup-orphaned-records.js'
      });
    }
    
    // Performance recommendations
    const performanceWarnings = this.warnings.filter(w => w.category === 'performance');
    if (performanceWarnings.length > 0) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        action: 'Consider database optimization and indexing for large organizations',
        script: 'node scripts/optimize-database.js'
      });
    }
    
    return recommendations;
  }
}

// CLI Interface
async function main() {
  const monitor = new DataIntegrityMonitor();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'check':
        await monitor.runCompleteCheck();
        break;
        
      case 'auth':
        await monitor.checkAuthDatabaseConsistency();
        break;
        
      case 'isolation':
        await monitor.checkOrganizationIsolation();
        break;
        
      case 'integrity':
        await monitor.checkReferentialIntegrity();
        break;
        
      case 'validation':
        await monitor.checkDataValidation();
        break;
        
      case 'performance':
        await monitor.checkPerformanceMetrics();
        break;
        
      default:
        console.log(`
🔍 MYCELIUM OS DATA INTEGRITY MONITOR

Usage:
  node scripts/data-integrity-monitor.js <command>

Commands:
  check                    Run complete integrity check
  auth                     Check Auth ↔ Database consistency
  isolation                Check organization data isolation
  integrity                Check referential integrity
  validation               Check data validation rules
  performance              Check performance metrics

Examples:
  node scripts/data-integrity-monitor.js check
  node scripts/data-integrity-monitor.js auth
  node scripts/data-integrity-monitor.js isolation
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

module.exports = DataIntegrityMonitor; 