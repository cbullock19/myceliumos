# 🛡️ BACKUP & DISASTER RECOVERY SYSTEM
## Complete Production-Grade Backup Solution for Mycelium OS

---

## 🚨 CRITICAL: DATABASE LOSS PREVENTION

After experiencing a complete database loss, this system ensures you'll never lose data again. The backup system provides:

- **Automated daily backups** of Auth + Database + Organization data
- **Data integrity monitoring** to catch issues before they become problems
- **Point-in-time recovery** for any organization or the entire system
- **Cloud storage integration** for off-site backup protection
- **Email notifications** for backup status and alerts

---

## 📋 SYSTEM OVERVIEW

### 🔐 What Gets Backed Up

1. **Supabase Auth Users & Sessions**
   - All user accounts and authentication data
   - User sessions and tokens
   - Email verification status

2. **PostgreSQL Database (Complete)**
   - All tables and data
   - Schema structure
   - Indexes and constraints
   - Row Level Security policies

3. **Organization-Specific Data**
   - Individual organization exports
   - Complete data isolation per tenant
   - Custom fields and configurations

4. **Configuration & Environment**
   - Environment variables backup
   - Application settings
   - Integration configurations

### 🕐 Backup Schedule

- **Daily Backups**: 2:00 AM (Auth + DB + All Orgs)
- **Weekly Backups**: Sunday 3:00 AM (Full system)
- **Monthly Backups**: 1st of month 4:00 AM (Long-term retention)
- **Integrity Checks**: 6:00 AM daily (Data validation)

---

## 🚀 QUICK START

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Add these to your `.env.local`:

```bash
# Backup System Configuration
BACKUP_NOTIFICATION_EMAILS=admin@yourcompany.com,tech@yourcompany.com
FROM_EMAIL=backups@myceliumos.app

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloud Storage (Optional but Recommended)
AWS_S3_BUCKET=mycelium-backups
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Or Google Cloud Storage
GOOGLE_CLOUD_BUCKET=mycelium-backups
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### 3. Run Your First Backup

```bash
# Complete backup (Auth + DB + All Orgs)
npm run backup

# Check data integrity
npm run integrity-check

# Start automated scheduler
npm run scheduler-start
```

---

## 📊 BACKUP COMMANDS

### Complete Backup Operations

```bash
# Full system backup
npm run backup

# Auth users only
npm run backup-auth

# Database only
npm run backup-db

# Specific organization
npm run backup-org clx123abc

# Verify backup integrity
npm run backup-verify backups/db-backup-2024-01-15.sql

# Generate backup report
npm run backup-report

# Clean up old backups
npm run backup-cleanup
```

### Restore Operations

```bash
# Restore from backup (with dry-run)
npm run backup-restore backups/db-backup-2024-01-15.sql --dry-run

# Restore specific organization
npm run backup-restore backups/org-clx123abc-2024-01-15.json

# Restore auth users
npm run backup-restore backups/auth-backup-2024-01-15.json
```

---

## 🔍 DATA INTEGRITY MONITORING

### Automated Checks

The system monitors:

1. **Auth ↔ Database Consistency**
   - Orphaned auth users
   - Missing database records
   - Email mismatches

2. **Organization Isolation**
   - Cross-organization data leaks
   - Misassigned users/clients
   - Tenant boundary violations

3. **Referential Integrity**
   - Orphaned deliverables
   - Invalid foreign keys
   - Broken relationships

4. **Data Validation**
   - Invalid email formats
   - Duplicate slugs
   - Overdue deliverables
   - Empty required fields

5. **Performance Metrics**
   - Large organizations
   - Many overdue deliverables
   - Database optimization opportunities

### Manual Integrity Checks

```bash
# Complete integrity check
npm run integrity-check

# Check auth consistency
npm run integrity-auth

# Check organization isolation
npm run integrity-isolation

# Check referential integrity
npm run integrity-integrity

# Check data validation
npm run integrity-validation

# Check performance metrics
npm run integrity-performance
```

---

## ⏰ AUTOMATED SCHEDULING

### Start the Scheduler

```bash
# Start automated backups
npm run scheduler-start

# Check scheduler status
npm run scheduler-status

# Stop scheduler
npm run scheduler-stop

# Manual backup trigger
npm run scheduler-backup daily

# Manual integrity check
npm run scheduler-check
```

### Schedule Configuration

The scheduler runs:

- **Daily**: 2:00 AM - Complete backup
- **Weekly**: Sunday 3:00 AM - Full system backup
- **Monthly**: 1st of month 4:00 AM - Long-term retention
- **Integrity**: 6:00 AM daily - Data validation

### Email Notifications

You'll receive email notifications for:

- ✅ Successful backups
- ❌ Failed backups
- 🚨 Critical integrity issues
- ⚠️ Performance warnings

---

## ☁️ CLOUD STORAGE INTEGRATION

### AWS S3 Setup

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://mycelium-backups
   ```

2. **Configure Lifecycle Rules**
   ```bash
   aws s3api put-bucket-lifecycle-configuration \
     --bucket mycelium-backups \
     --lifecycle-configuration file://lifecycle.json
   ```

3. **Set Environment Variables**
   ```bash
   AWS_S3_BUCKET=mycelium-backups
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   ```

### Google Cloud Storage Setup

1. **Create Storage Bucket**
   ```bash
   gsutil mb gs://mycelium-backups
   ```

2. **Set Environment Variables**
   ```bash
   GOOGLE_CLOUD_BUCKET=mycelium-backups
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   ```

---

## 🔄 DISASTER RECOVERY PROCEDURES

### Complete System Recovery

1. **Stop Application**
   ```bash
   # Stop your application
   npm run build
   ```

2. **Restore Database**
   ```bash
   # Restore from latest backup
   npm run backup-restore backups/db-backup-2024-01-15.sql
   ```

3. **Restore Auth Users** (if needed)
   ```bash
   # Manual auth user restoration
   npm run backup-restore backups/auth-backup-2024-01-15.json
   ```

4. **Verify Integrity**
   ```bash
   # Run integrity check
   npm run integrity-check
   ```

5. **Restart Application**
   ```bash
   npm run start
   ```

### Organization-Specific Recovery

```bash
# Restore specific organization
npm run backup-restore backups/org-clx123abc-2024-01-15.json

# Verify organization data
npm run integrity-check
```

### Point-in-Time Recovery

```bash
# List available backups
ls -la backups/

# Restore from specific date
npm run backup-restore backups/db-backup-2024-01-10.sql

# Verify data integrity
npm run integrity-check
```

---

## 📁 BACKUP STORAGE STRUCTURE

```
backups/
├── auth/                          # Supabase Auth backups
│   ├── auth-backup-2024-01-15.json
│   └── auth-backup-2024-01-16.json
├── database/                      # PostgreSQL dumps
│   ├── db-backup-2024-01-15.sql
│   └── db-backup-2024-01-16.sql
├── organizations/                 # Organization-specific backups
│   ├── org-clx123abc-2024-01-15.json
│   └── org-def456ghi-2024-01-15.json
└── reports/                      # Integrity reports
    ├── integrity-report-2024-01-15.json
    └── backup-report-2024-01-15.json
```

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database connection
npm run db:check

# Troubleshoot connection
npm run db:troubleshoot
```

#### 2. Backup Failed
```bash
# Check environment variables
npm run validate-env

# Test backup manually
npm run backup-db
```

#### 3. Integrity Check Failed
```bash
# Run specific checks
npm run integrity-auth
npm run integrity-isolation
npm run integrity-integrity
```

#### 4. Scheduler Not Working
```bash
# Check scheduler status
npm run scheduler-status

# Restart scheduler
npm run scheduler-stop
npm run scheduler-start
```

### Log Files

Check these locations for detailed logs:

- **Backup logs**: `backups/` directory
- **Integrity reports**: `reports/` directory
- **Application logs**: Console output
- **Email logs**: SMTP server logs

---

## 🛡️ SECURITY CONSIDERATIONS

### Backup Security

1. **Encryption**: All backups are encrypted at rest
2. **Access Control**: Limited access to backup files
3. **Network Security**: Secure transfer to cloud storage
4. **Audit Logging**: All backup operations logged

### Environment Variables

Never commit these to version control:

```bash
# Keep these secure
SUPABASE_SERVICE_ROLE_KEY=your-service-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials
```

### Backup Retention

- **Daily backups**: 7 days
- **Weekly backups**: 30 days
- **Monthly backups**: 1 year
- **Integrity reports**: 90 days

---

## 📈 MONITORING & ALERTS

### Health Monitoring

The system provides:

- **Backup success/failure notifications**
- **Data integrity alerts**
- **Performance warnings**
- **Storage usage monitoring**

### Alert Configuration

```bash
# Set notification emails
BACKUP_NOTIFICATION_EMAILS=admin@company.com,tech@company.com

# Configure alert thresholds
INTEGRITY_ALERT_THRESHOLD=5
PERFORMANCE_WARNING_THRESHOLD=100
```

### Dashboard Integration

Future integration with:

- **Grafana dashboards**
- **Slack notifications**
- **PagerDuty alerts**
- **Custom monitoring**

---

## 🚀 PRODUCTION DEPLOYMENT

### 1. Environment Setup

```bash
# Production environment variables
NODE_ENV=production
BACKUP_NOTIFICATION_EMAILS=admin@myceliumos.app
SMTP_HOST=smtp.sendgrid.net
AWS_S3_BUCKET=mycelium-prod-backups
```

### 2. Cloud Storage Setup

```bash
# Create production backup bucket
aws s3 mb s3://mycelium-prod-backups

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket mycelium-prod-backups \
  --versioning-configuration Status=Enabled
```

### 3. Automated Deployment

```bash
# Deploy with backup system
npm run build
npm run scheduler-start
```

### 4. Monitoring Setup

```bash
# Start monitoring
npm run integrity-check
npm run scheduler-status
```

---

## 📞 SUPPORT & MAINTENANCE

### Regular Maintenance

- **Weekly**: Review backup reports
- **Monthly**: Test restore procedures
- **Quarterly**: Update backup strategies
- **Annually**: Review disaster recovery plan

### Emergency Procedures

1. **Immediate Response**
   - Stop application if needed
   - Assess data loss scope
   - Notify stakeholders

2. **Recovery Process**
   - Restore from latest backup
   - Verify data integrity
   - Test application functionality

3. **Post-Recovery**
   - Document incident
   - Update procedures
   - Implement improvements

---

## 🎯 SUCCESS METRICS

### Backup Success Rate
- **Target**: 99.9% backup success rate
- **Monitoring**: Daily backup completion
- **Alerting**: Failed backup notifications

### Recovery Time Objective (RTO)
- **Target**: < 1 hour for complete recovery
- **Testing**: Monthly recovery drills
- **Documentation**: Step-by-step procedures

### Data Integrity
- **Target**: 100% data integrity
- **Monitoring**: Daily integrity checks
- **Alerting**: Critical issue notifications

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- [Database Schema](./database_complete.md)
- [Technical Architecture](./technical_architecture.md)
- [API Documentation](./api_documentation.md)

### Tools
- [Backup System](./scripts/backup-system.js)
- [Integrity Monitor](./scripts/data-integrity-monitor.js)
- [Scheduler](./scripts/backup-scheduler.js)

### Support
- **Email**: support@myceliumos.app
- **Documentation**: docs.myceliumos.app
- **GitHub**: github.com/mycelium-os

---

## 🚨 EMERGENCY CONTACTS

### Critical Issues
- **Data Loss**: Immediate backup restoration
- **System Down**: Emergency recovery procedures
- **Security Breach**: Incident response team

### Contact Information
- **Primary**: admin@myceliumos.app
- **Secondary**: tech@myceliumos.app
- **Emergency**: +1-555-BACKUP

---

*This backup system ensures your Mycelium OS data is protected against any disaster scenario. Regular testing and monitoring are essential for maintaining data security and business continuity.* 