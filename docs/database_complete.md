# DATABASE SCHEMA - MYCELIUM OS
## Complete Multi-Tenant Database Architecture

---

## 🏗️ SCHEMA OVERVIEW

This database schema supports unlimited organizations with complete data isolation, flexible service configurations, and scalable deliverable management. Every table includes organization-level isolation with Row Level Security (RLS) enforcement.

---

## 📋 PRISMA SCHEMA COMPLETE

```prisma
// Mycelium OS - Complete Database Schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ====== CORE TENANT ARCHITECTURE ======

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique // For subdomain routing: client.agencyname.com
  description String?
  website     String?
  industry    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Branding & Customization
  branding    OrganizationBranding?
  
  // Configuration
  settings    OrganizationSettings?
  
  // Relationships
  users           User[]
  clients         Client[]
  deliverables    Deliverable[]
  projects        Project[]
  serviceTypes    ServiceType[]
  activityLogs    ActivityLog[]
  notifications   Notification[]
  integrations    Integration[]
  
  // Billing (Future)
  subscription    Subscription?
  
  @@map("organizations")
}

model OrganizationBranding {
  id             String @id @default(cuid())
  organizationId String @unique
  
  // Visual Identity
  primaryColor   String @default("#228B22") // Forest green default
  secondaryColor String?
  logoUrl        String?
  faviconUrl     String?
  
  // Email Branding
  emailHeaderHtml String?
  emailFooterHtml String?
  emailSignature  String?
  
  // Client Portal Branding
  portalWelcomeMessage String?
  portalSupportEmail   String?
  customDomain         String? // client.agencyname.com
  customCSS           String? // Custom portal styling
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("organization_branding")
}

model OrganizationSettings {
  id             String @id @default(cuid())
  organizationId String @unique
  
  // General Settings
  timezone       String @default("America/New_York")
  dateFormat     String @default("MM/DD/YYYY")
  weekStartsOn   Int    @default(1) // 1 = Monday, 0 = Sunday
  
  // Notification Settings
  enableEmailNotifications  Boolean @default(true)
  enableSlackNotifications  Boolean @default(false)
  notificationFrequency     String  @default("daily") // immediate, daily, weekly
  
  // Deliverable Settings
  autoAssignToAdmin         Boolean @default(true)
  defaultDeliverableDuration Int    @default(7) // days
  enableRecurringGeneration Boolean @default(true)
  
  // Security Settings
  requirePasswordChange     Boolean @default(true)
  sessionTimeoutHours      Int     @default(24)
  maxLoginAttempts         Int     @default(5)
  
  // Feature Flags
  enableClientPortal       Boolean @default(true)
  enableTimeTracking       Boolean @default(false)
  enableFileVersioning     Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("organization_settings")
}

// ====== USER MANAGEMENT ======

model User {
  id             String     @id @default(cuid())
  organizationId String
  email          String     @unique
  name           String
  role           UserRole
  status         UserStatus @default(PENDING)
  
  // Authentication
  hashedPassword String?
  emailVerified  Boolean    @default(false)
  lastLoginAt    DateTime?
  loginAttempts  Int        @default(0)
  lockedAt       DateTime?
  
  // Profile
  avatarUrl      String?
  phone          String?
  title          String?
  bio            String?
  
  // Permissions (for CUSTOM role)
  permissions    Json?
  
  // Invitation System
  invitedBy      String?
  invitedAt      DateTime?
  temporaryPassword String? // Encrypted, expires after first login
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  organization        Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  inviter            User?        @relation("UserInvitations", fields: [invitedBy], references: [id])
  invitedUsers       User[]       @relation("UserInvitations")
  
  // Work Assignments
  assignedClients     ClientAssignment[]
  assignedDeliverables Deliverable[] @relation("DeliverableAssignee")
  completedDeliverables Deliverable[] @relation("DeliverableCompleter")
  createdDeliverables Deliverable[] @relation("DeliverableCreator")
  
  // Activity Tracking
  activityLogs       ActivityLog[]
  sentNotifications  Notification[] @relation("NotificationSender")
  receivedNotifications NotificationRecipient[]
  
  // Comments & Communication
  comments           Comment[]
  timeEntries        TimeEntry[]
  
  @@index([organizationId])
  @@index([email])
  @@index([role])
  @@index([status])
  @@map("users")
}

enum UserRole {
  ADMIN
  VIDEO_EDITOR
  SEO_STRATEGIST
  WEBSITE_DESIGNER
  FILMER
  CUSTOM
  CLIENT // For client portal users
}

enum UserStatus {
  ACTIVE
  INACTIVE
  PENDING
  SUSPENDED
}

// ====== SERVICE TYPE SYSTEM ======

model ServiceType {
  id             String @id @default(cuid())
  organizationId String
  name           String // "Social Media", "SEO", "Website Design"
  slug           String // "social", "seo", "website"
  description    String?
  isActive       Boolean @default(true)
  sortOrder      Int     @default(0)
  
  // Workflow Configuration
  workflowType   WorkflowType
  defaultDuration Int        @default(7) // Default deliverable duration in days
  
  // Billing Configuration (Future)
  defaultRate    Decimal?   @db.Decimal(10, 2)
  billingCycle   String?    // "monthly", "project", "hourly"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  organization       Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  deliverableFields  DeliverableField[]
  clientAssignments  ClientAssignment[]
  deliverables       Deliverable[]
  
  @@unique([organizationId, slug])
  @@index([organizationId])
  @@map("service_types")
}

enum WorkflowType {
  RECURRING  // Monthly recurring deliverables (social media)
  PROJECT    // Fixed timeline projects (SEO campaigns)
  MILESTONE  // Phase-based projects (website builds)
  ONEOFF     // Single deliverables
}

model DeliverableField {
  id            String @id @default(cuid())
  serviceTypeId String
  name          String // "Due Date", "Dropbox Link", "Client Approval"
  slug          String // "due_date", "dropbox_link", "client_approval"
  type          FieldType
  isRequired    Boolean @default(false)
  sortOrder     Int     @default(0)
  
  // Field Configuration
  defaultValue  String?
  placeholder   String?
  helpText      String?
  
  // Validation Rules
  minLength     Int?
  maxLength     Int?
  minValue      Decimal? @db.Decimal(10, 2)
  maxValue      Decimal? @db.Decimal(10, 2)
  pattern       String? // Regex pattern for validation
  
  // Dropdown Options
  options       Json? // Array of options for SELECT/RADIO fields
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  serviceType ServiceType @relation(fields: [serviceTypeId], references: [id], onDelete: Cascade)
  
  @@unique([serviceTypeId, slug])
  @@index([serviceTypeId])
  @@map("deliverable_fields")
}

enum FieldType {
  TEXT
  TEXTAREA
  NUMBER
  DECIMAL
  DATE
  DATETIME
  TIME
  EMAIL
  URL
  PHONE
  SELECT
  MULTISELECT
  RADIO
  CHECKBOX
  FILE
  USER_SELECT
  CLIENT_SELECT
}

// ====== CLIENT MANAGEMENT ======

model Client {
  id             String @id @default(cuid())
  organizationId String
  name           String
  slug           String // URL-friendly version of name
  
  // Contact Information
  contactEmail   String?
  contactPhone   String?
  contactPerson  String?
  
  // Company Details
  companyName    String?
  website        String?
  industry       String?
  address        Json? // Flexible address structure
  
  // Client Settings
  status         ClientStatus @default(ACTIVE)
  isPaused       Boolean      @default(false)
  pausedAt       DateTime?
  pausedReason   String?
  
  // Communication Preferences
  notificationEmail String?
  preferredContactMethod String? // "email", "phone", "slack"
  
  // File Management
  dropboxFolderUrl String?
  driveId         String? // Google Drive folder ID
  
  // Custom Fields (Organization-specific)
  customFields   Json?
  
  // Internal Notes
  notes          String?
  tags           String[] @default([])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  assignments       ClientAssignment[]
  deliverables      Deliverable[]
  projects          Project[]
  
  // Client Portal Access
  clientUsers       ClientUser[]
  
  @@unique([organizationId, slug])
  @@index([organizationId])
  @@index([status])
  @@map("clients")
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  PAUSED
  ARCHIVED
  TERMINATED
}

model ClientAssignment {
  id           String @id @default(cuid())
  clientId     String
  userId       String
  serviceTypeId String
  role         AssignmentRole @default(PRIMARY)
  isActive     Boolean        @default(true)
  
  assignedAt   DateTime @default(now())
  assignedBy   String? // User ID who made the assignment
  
  client       Client      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  serviceType  ServiceType @relation(fields: [serviceTypeId], references: [id], onDelete: Cascade)
  
  @@unique([clientId, userId, serviceTypeId])
  @@index([clientId])
  @@index([userId])
  @@map("client_assignments")
}

enum AssignmentRole {
  PRIMARY   // Main contact, gets notifications
  SECONDARY // Backup, can view and edit
  VIEWER    // Read-only access
}

// ====== CLIENT PORTAL USERS ======

model ClientUser {
  id       String @id @default(cuid())
  clientId String
  email    String @unique
  name     String
  role     ClientUserRole @default(VIEWER)
  
  // Authentication
  hashedPassword String?
  emailVerified  Boolean   @default(false)
  lastLoginAt    DateTime?
  isActive       Boolean   @default(true)
  
  // Profile
  title    String?
  phone    String?
  
  // Permissions
  canApprove      Boolean @default(false)
  canDownload     Boolean @default(true)
  canComment      Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  @@index([clientId])
  @@map("client_users")
}

enum ClientUserRole {
  PRIMARY // Main contact, full permissions
  VIEWER  // Read-only access
  ADMIN   // Can manage other client users
}

// ====== PROJECT & DELIVERABLE SYSTEM ======

model Project {
  id             String @id @default(cuid())
  organizationId String
  clientId       String
  name           String
  description    String?
  
  // Project Details
  status         ProjectStatus @default(PLANNING)
  priority       Priority      @default(MEDIUM)
  
  // Timeline
  startDate      DateTime?
  endDate        DateTime?
  estimatedHours Decimal? @db.Decimal(8, 2)
  
  // Budget (Future)
  budgetAmount   Decimal? @db.Decimal(10, 2)
  currency       String?  @default("USD")
  
  // Project Manager
  managerId      String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  client         Client       @relation(fields: [clientId], references: [id], onDelete: Cascade)
  deliverables   Deliverable[]
  
  @@index([organizationId])
  @@index([clientId])
  @@index([status])
  @@map("projects")
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
}

model Deliverable {
  id             String @id @default(cuid())
  organizationId String
  clientId       String
  projectId      String?
  serviceTypeId  String
  
  // Basic Information
  title          String
  description    String?
  status         DeliverableStatus @default(PENDING)
  priority       Priority          @default(MEDIUM)
  
  // Assignment
  assignedUserId String?
  createdById    String
  
  // Timeline
  dueDate        DateTime?
  startDate      DateTime?
  estimatedHours Decimal? @db.Decimal(6, 2)
  actualHours    Decimal? @db.Decimal(6, 2)
  
  // Completion Tracking
  completedAt    DateTime?
  completedById  String?
  approvedAt     DateTime?
  approvedById   String?
  
  // Custom Field Values (Dynamic based on service type)
  customFields   Json?
  
  // File Attachments
  attachments    Json? // Array of file metadata
  
  // Recurring Deliverable Settings
  isRecurring    Boolean @default(false)
  recurrenceRule String? // Cron-like pattern
  parentId       String? // Original deliverable for recurring copies
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  client         Client       @relation(fields: [clientId], references: [id], onDelete: Cascade)
  project        Project?     @relation(fields: [projectId], references: [id], onDelete: SetNull)
  serviceType    ServiceType  @relation(fields: [serviceTypeId], references: [id], onDelete: Cascade)
  
  assignedUser   User?        @relation("DeliverableAssignee", fields: [assignedUserId], references: [id], onDelete: SetNull)
  createdBy      User         @relation("DeliverableCreator", fields: [createdById], references: [id], onDelete: Cascade)
  completedBy    User?        @relation("DeliverableCompleter", fields: [completedById], references: [id], onDelete: SetNull)
  
  // Child Relationships
  comments       Comment[]
  timeEntries    TimeEntry[]
  parent         Deliverable? @relation("RecurringDeliverables", fields: [parentId], references: [id])
  children       Deliverable[] @relation("RecurringDeliverables")
  
  @@index([organizationId])
  @@index([clientId])
  @@index([assignedUserId])
  @@index([status])
  @@index([dueDate])
  @@map("deliverables")
}

enum DeliverableStatus {
  PENDING
  IN_PROGRESS
  NEEDS_REVIEW
  NEEDS_APPROVAL
  APPROVED
  COMPLETED
  OVERDUE
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

// ====== COMMUNICATION SYSTEM ======

model Comment {
  id             String @id @default(cuid())
  deliverableId  String
  userId         String
  content        String
  
  // Comment Type
  type           CommentType @default(GENERAL)
  isInternal     Boolean     @default(false) // Hidden from client portal
  
  // Rich Content
  attachments    Json? // File attachments
  mentions       String[] @default([]) // User IDs mentioned
  
  // Threading
  parentId       String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  deliverable    Deliverable @relation(fields: [deliverableId], references: [id], onDelete: Cascade)
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent         Comment?    @relation("CommentReplies", fields: [parentId], references: [id])
  replies        Comment[]   @relation("CommentReplies")
  
  @@index([deliverableId])
  @@index([userId])
  @@map("comments")
}

enum CommentType {
  GENERAL
  FEEDBACK
  APPROVAL_REQUEST
  REVISION_REQUEST
  STATUS_UPDATE
}

// ====== TIME TRACKING ======

model TimeEntry {
  id             String @id @default(cuid())
  userId         String
  deliverableId  String
  
  // Time Details
  description    String?
  startTime      DateTime
  endTime        DateTime?
  duration       Int? // Minutes
  
  // Billing (Future)
  hourlyRate     Decimal? @db.Decimal(8, 2)
  billableAmount Decimal? @db.Decimal(10, 2)
  isBillable     Boolean  @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  deliverable  Deliverable @relation(fields: [deliverableId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([deliverableId])
  @@index([startTime])
  @@map("time_entries")
}

// ====== NOTIFICATION SYSTEM ======

model Notification {
  id             String @id @default(cuid())
  organizationId String
  type           NotificationType
  title          String
  message        String
  
  // Targeting
  senderId       String?
  
  // Delivery Channels
  channels       String[] @default([]) // ["email", "slack", "push"]
  
  // Scheduling
  scheduledFor   DateTime?
  sentAt         DateTime?
  
  // Context Data
  relatedId      String? // ID of related resource (deliverable, client, etc.)
  relatedType    String? // Type of related resource
  metadata       Json?
  
  // Delivery Status
  status         NotificationStatus @default(PENDING)
  failureReason  String?
  retryCount     Int                @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  sender       User?        @relation("NotificationSender", fields: [senderId], references: [id], onDelete: SetNull)
  recipients   NotificationRecipient[]
  
  @@index([organizationId])
  @@index([type])
  @@index([status])
  @@index([scheduledFor])
  @@map("notifications")
}

model NotificationRecipient {
  id             String @id @default(cuid())
  notificationId String
  userId         String
  
  // Delivery Status
  deliveredAt    DateTime?
  readAt         DateTime?
  channel        String // "email", "slack", "push"
  
  // Email Specific
  emailAddress   String?
  emailStatus    String? // "sent", "delivered", "bounced", "opened"
  
  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([notificationId, userId, channel])
  @@index([userId])
  @@map("notification_recipients")
}

enum NotificationType {
  DELIVERABLE_ASSIGNED
  DELIVERABLE_DUE_SOON
  DELIVERABLE_OVERDUE
  DELIVERABLE_COMPLETED
  DELIVERABLE_APPROVED
  DELIVERABLE_NEEDS_REVIEW
  CLIENT_ADDED
  CLIENT_UPDATED
  USER_INVITED
  USER_ACTIVATED
  PROJECT_CREATED
  PROJECT_COMPLETED
  COMMENT_ADDED
  MENTION_RECEIVED
  INTEGRATION_ERROR
  SYSTEM_MAINTENANCE
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  CANCELLED
}

// ====== INTEGRATION SYSTEM ======

model Integration {
  id             String @id @default(cuid())
  organizationId String
  type           IntegrationType
  name           String
  
  // Connection Status
  isEnabled      Boolean @default(false)
  isConnected    Boolean @default(false)
  lastSyncAt     DateTime?
  
  // Configuration
  config         Json // Encrypted credentials and settings
  webhookUrl     String? // For receiving updates
  
  // Error Handling
  errorCount     Int     @default(0)
  lastError      String?
  lastErrorAt    DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, type])
  @@index([organizationId])
  @@map("integrations")
}

enum IntegrationType {
  DROPBOX
  GOOGLE_DRIVE
  SLACK
  MICROSOFT_TEAMS
  ZAPIER
  WEBHOOKS
  EMAIL_SMTP
  CALENDAR
  STRIPE // Future billing
}

// ====== ACTIVITY LOGGING ======

model ActivityLog {
  id             String @id @default(cuid())
  organizationId String
  userId         String?
  
  // Action Details
  action         String // "created", "updated", "deleted", "completed"
  resourceType   String // "client", "deliverable", "user", "project"
  resourceId     String
  resourceName   String? // Human-readable name
  
  // Change Details
  oldValues      Json?
  newValues      Json?
  changedFields  String[] @default([])
  
  // Context
  ipAddress      String?
  userAgent      String?
  sessionId      String?
  
  // Metadata
  metadata       Json?
  
  timestamp DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([organizationId])
  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([timestamp])
  @@map("activity_logs")
}

// ====== FUTURE: BILLING SYSTEM ======

model Subscription {
  id             String @id @default(cuid())
  organizationId String @unique
  
  // Plan Details
  planName       String
  planPrice      Decimal @db.Decimal(8, 2)
  currency       String  @default("USD")
  billingCycle   String  @default("monthly") // "monthly", "yearly"
  
  // Status
  status         SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  
  // Stripe Integration
  stripeCustomerId     String?
  stripeSubscriptionId String?
  
  // Usage Limits
  maxUsers       Int?
  maxClients     Int?
  maxProjects    Int?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("subscriptions")
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  UNPAID
  TRIALING
}
```

---

## 🔐 ROW LEVEL SECURITY POLICIES

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organization isolation policies
CREATE POLICY "users_org_isolation" ON users
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "clients_org_isolation" ON clients  
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "deliverables_org_isolation" ON deliverables
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "projects_org_isolation" ON projects
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "service_types_org_isolation" ON service_types
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- User-specific access policies
CREATE POLICY "deliverables_user_access" ON deliverables
  FOR SELECT USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    AND (
      -- Admins see everything
      (auth.jwt() ->> 'role') = 'ADMIN'
      -- Users see assigned deliverables
      OR assigned_user_id = (auth.jwt() ->> 'sub')::uuid
      -- Custom users with permissions see service-specific deliverables
      OR (
        (auth.jwt() ->> 'role') = 'CUSTOM'
        AND service_type_id IN (
          SELECT id FROM service_types 
          WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
          AND slug = ANY(string_to_array(auth.jwt() ->> 'service_access', ','))
        )
      )
    )
  );
```

---

## 📈 DATABASE INDEXES FOR PERFORMANCE

```sql
-- Core lookup indexes
CREATE INDEX idx_users_org_email ON users(organization_id, email);
CREATE INDEX idx_clients_org_status ON clients(organization_id, status);
CREATE INDEX idx_deliverables_org_status ON deliverables(organization_id, status);
CREATE INDEX idx_deliverables_org_user ON deliverables(organization_id, assigned_user_id);
CREATE INDEX idx_deliverables_org_due ON deliverables(organization_id, due_date);

-- Search and filtering indexes
CREATE INDEX idx_clients_name_search ON clients USING gin(to_tsvector('english', name));
CREATE INDEX idx_deliverables_title_search ON deliverables USING gin(to_tsvector('english', title));

-- Performance indexes for dashboards
CREATE INDEX idx_deliverables_dashboard ON deliverables(organization_id, assigned_user_id, status, due_date);
CREATE INDEX idx_activity_logs_recent ON activity_logs(organization_id, timestamp DESC);

-- Custom field search indexes (JSONB)
CREATE INDEX idx_deliverables_custom_fields ON deliverables USING gin(custom_fields);
CREATE INDEX idx_clients_custom_fields ON clients USING gin(custom_fields);
```

---

## 🔄 DATABASE FUNCTIONS & TRIGGERS

```sql
-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate client slugs
CREATE OR REPLACE FUNCTION generate_client_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug = trim(both '-' from NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_client_slug_trigger BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION generate_client_slug();

-- Activity logging trigger
CREATE OR REPLACE FUNCTION log_deliverable_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs(organization_id, user_id, action, resource_type, resource_id, new_values)
    VALUES(NEW.organization_id, NEW.created_by_id, 'created', 'deliverable', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activity_logs(organization_id, user_id, action, resource_type, resource_id, old_values, new_values)
    VALUES(NEW.organization_id, NEW.created_by_id, 'updated', 'deliverable', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs(organization_id, user_id, action, resource_type, resource_id, old_values)
    VALUES(OLD.organization_id, OLD.created_by_id, 'deleted', 'deliverable', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$ language 'plpgsql';

CREATE TRIGGER log_deliverable_changes_trigger 
  AFTER INSERT OR UPDATE OR DELETE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION log_deliverable_changes();

-- Notification trigger for overdue deliverables
CREATE OR REPLACE FUNCTION check_overdue_deliverables()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.due_date < CURRENT_TIMESTAMP AND NEW.status != 'COMPLETED' AND NEW.status != 'OVERDUE' THEN
    NEW.status = 'OVERDUE';
    
    -- Create notification
    INSERT INTO notifications(organization_id, type, title, message, related_id, related_type)
    VALUES(
      NEW.organization_id,
      'DELIVERABLE_OVERDUE',
      'Deliverable Overdue',
      'Deliverable "' || NEW.title || '" is now overdue.',
      NEW.id,
      'deliverable'
    );
  END IF;
  RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER check_overdue_trigger BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION check_overdue_deliverables();
```

---

## 🔍 DATABASE VIEWS FOR COMPLEX QUERIES

```sql
-- Dashboard view for user assignments
CREATE VIEW user_dashboard_data AS
SELECT 
  u.id as user_id,
  u.organization_id,
  u.name as user_name,
  u.role,
  COUNT(d.id) FILTER (WHERE d.status = 'PENDING') as pending_tasks,
  COUNT(d.id) FILTER (WHERE d.status = 'IN_PROGRESS') as active_tasks,
  COUNT(d.id) FILTER (WHERE d.status = 'OVERDUE') as overdue_tasks,
  COUNT(d.id) FILTER (WHERE d.due_date::date = CURRENT_DATE) as due_today,
  COUNT(d.id) FILTER (WHERE d.due_date BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '7 days') as due_this_week
FROM users u
LEFT JOIN deliverables d ON d.assigned_user_id = u.id
WHERE u.status = 'ACTIVE'
GROUP BY u.id, u.organization_id, u.name, u.role;

-- Client overview with service types
CREATE VIEW client_overview AS
SELECT 
  c.id,
  c.organization_id,
  c.name,
  c.status,
  c.contact_email,
  ARRAY_AGG(DISTINCT st.name) as service_types,
  COUNT(DISTINCT d.id) as total_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'COMPLETED') as completed_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'OVERDUE') as overdue_deliverables,
  MAX(d.due_date) as next_deadline
FROM clients c
LEFT JOIN client_assignments ca ON ca.client_id = c.id
LEFT JOIN service_types st ON st.id = ca.service_type_id
LEFT JOIN deliverables d ON d.client_id = c.id
GROUP BY c.id, c.organization_id, c.name, c.status, c.contact_email;

-- Organization analytics view
CREATE VIEW organization_analytics AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'ACTIVE') as active_users,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ACTIVE') as active_clients,
  COUNT(DISTINCT d.id) as total_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'COMPLETED') as completed_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'OVERDUE') as overdue_deliverables,
  ROUND(
    (COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'COMPLETED') * 100.0) / 
    NULLIF(COUNT(DISTINCT d.id), 0), 
    2
  ) as completion_rate,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT st.id) as service_types_count
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN clients c ON c.organization_id = o.id
LEFT JOIN deliverables d ON d.organization_id = o.id
LEFT JOIN projects p ON p.organization_id = o.id
LEFT JOIN service_types st ON st.organization_id = o.id
GROUP BY o.id, o.name;

-- Recent activity view
CREATE VIEW recent_activity AS
SELECT 
  al.id,
  al.organization_id,
  al.action,
  al.resource_type,
  al.resource_id,
  al.timestamp,
  u.name as user_name,
  u.avatar_url as user_avatar,
  CASE 
    WHEN al.resource_type = 'deliverable' THEN d.title
    WHEN al.resource_type = 'client' THEN c.name
    WHEN al.resource_type = 'project' THEN p.name
    ELSE al.resource_name
  END as resource_name
FROM activity_logs al
LEFT JOIN users u ON u.id = al.user_id
LEFT JOIN deliverables d ON d.id::text = al.resource_id AND al.resource_type = 'deliverable'
LEFT JOIN clients c ON c.id::text = al.resource_id AND al.resource_type = 'client'
LEFT JOIN projects p ON p.id::text = al.resource_id AND al.resource_type = 'project'
ORDER BY al.timestamp DESC;
```

---

## 📊 STORED PROCEDURES FOR BUSINESS LOGIC

```sql
-- Generate monthly recurring deliverables
CREATE OR REPLACE FUNCTION generate_monthly_deliverables(org_id UUID, target_month DATE)
RETURNS INTEGER AS $
DECLARE
  client_record RECORD;
  service_record RECORD;
  template_record RECORD;
  deliverable_count INTEGER := 0;
BEGIN
  -- Loop through active clients
  FOR client_record IN 
    SELECT * FROM clients 
    WHERE organization_id = org_id 
    AND status = 'ACTIVE' 
    AND (is_paused = false OR is_paused IS NULL)
  LOOP
    -- Loop through client's service types
    FOR service_record IN
      SELECT DISTINCT st.* 
      FROM service_types st
      JOIN client_assignments ca ON ca.service_type_id = st.id
      WHERE ca.client_id = client_record.id
      AND st.workflow_type = 'RECURRING'
    LOOP
      -- Generate deliverables based on service template
      INSERT INTO deliverables (
        organization_id,
        client_id,
        service_type_id,
        title,
        status,
        due_date,
        created_by_id,
        is_recurring
      )
      SELECT 
        org_id,
        client_record.id,
        service_record.id,
        service_record.name || ' - ' || TO_CHAR(target_month, 'Month YYYY'),
        'PENDING',
        target_month + INTERVAL '1 month' - INTERVAL '1 day',
        (SELECT id FROM users WHERE organization_id = org_id AND role = 'ADMIN' LIMIT 1),
        true;
      
      deliverable_count := deliverable_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN deliverable_count;
END;
$ LANGUAGE plpgsql;

-- Calculate user productivity metrics
CREATE OR REPLACE FUNCTION calculate_user_productivity(user_id_param UUID, period_days INTEGER DEFAULT 30)
RETURNS JSON AS $
DECLARE
  result JSON;
  total_assigned INTEGER;
  total_completed INTEGER;
  avg_completion_time INTERVAL;
  overdue_count INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * period_days),
    COUNT(*) FILTER (WHERE status = 'COMPLETED' AND completed_at >= CURRENT_DATE - INTERVAL '1 day' * period_days),
    AVG(completed_at - created_at) FILTER (WHERE status = 'COMPLETED' AND completed_at >= CURRENT_DATE - INTERVAL '1 day' * period_days),
    COUNT(*) FILTER (WHERE status = 'OVERDUE')
  INTO total_assigned, total_completed, avg_completion_time, overdue_count
  FROM deliverables
  WHERE assigned_user_id = user_id_param;
  
  result := json_build_object(
    'user_id', user_id_param,
    'period_days', period_days,
    'total_assigned', COALESCE(total_assigned, 0),
    'total_completed', COALESCE(total_completed, 0),
    'completion_rate', CASE 
      WHEN total_assigned > 0 THEN ROUND((total_completed * 100.0) / total_assigned, 2)
      ELSE 0 
    END,
    'avg_completion_hours', CASE 
      WHEN avg_completion_time IS NOT NULL THEN EXTRACT(EPOCH FROM avg_completion_time) / 3600
      ELSE NULL 
    END,
    'overdue_count', COALESCE(overdue_count, 0),
    'productivity_score', CASE 
      WHEN total_assigned > 0 THEN 
        GREATEST(0, LEAST(100, 
          (total_completed * 100.0 / total_assigned) - (overdue_count * 10)
        ))
      ELSE 0 
    END
  );
  
  RETURN result;
END;
$ LANGUAGE plpgsql;

-- Organization onboarding setup
CREATE OR REPLACE FUNCTION setup_organization_defaults(org_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  -- Create default service types
  INSERT INTO service_types (organization_id, name, slug, workflow_type, default_duration) VALUES
  (org_id, 'Social Media', 'social', 'RECURRING', 7),
  (org_id, 'SEO', 'seo', 'PROJECT', 30),
  (org_id, 'Website Design', 'website', 'MILESTONE', 60),
  (org_id, 'One-off Projects', 'oneoff', 'ONEOFF', 14);
  
  -- Create default deliverable fields for social media
  INSERT INTO deliverable_fields (service_type_id, name, slug, type, is_required, sort_order) 
  SELECT st.id, 'Deliverable Name', 'deliverable_name', 'TEXT', true, 1
  FROM service_types st WHERE st.organization_id = org_id AND st.slug = 'social';
  
  INSERT INTO deliverable_fields (service_type_id, name, slug, type, is_required, sort_order)
  SELECT st.id, 'Edit By Date', 'edit_by_date', 'DATE', true, 2
  FROM service_types st WHERE st.organization_id = org_id AND st.slug = 'social';
  
  INSERT INTO deliverable_fields (service_type_id, name, slug, type, is_required, sort_order)
  SELECT st.id, 'Dropbox Link', 'dropbox_link', 'URL', false, 3
  FROM service_types st WHERE st.organization_id = org_id AND st.slug = 'social';
  
  -- Create organization settings
  INSERT INTO organization_settings (organization_id) VALUES (org_id);
  
  -- Create organization branding
  INSERT INTO organization_branding (organization_id) VALUES (org_id);
  
  RETURN true;
END;
$ LANGUAGE plpgsql;
```

---

## 🚀 DATABASE SEED DATA FOR TESTING

```sql
-- Insert test organization
INSERT INTO organizations (id, name, slug, description) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'IseMedia Agency', 'isemedia', 'Creative agency specializing in social media and digital marketing');

-- Set up organization defaults
SELECT setup_organization_defaults('550e8400-e29b-41d4-a716-446655440000');

-- Insert test admin users
INSERT INTO users (id, organization_id, email, name, role, status, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'christiaan@isemediaagency.com', 'Christiaan Bullock', 'ADMIN', 'ACTIVE', true),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'caleb@isemediaagency.com', 'Caleb Isemann', 'ADMIN', 'ACTIVE', true);

-- Insert test clients
INSERT INTO clients (id, organization_id, name, slug, contact_email, contact_person, status) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'GTG Builders', 'gtg-builders', 'contact@gtgbuilders.com', 'John Smith', 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Ort Farms', 'ort-farms', 'info@ortfarms.com', 'Sarah Johnson', 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Hennebry Pest Solutions', 'hennebry-pest', 'admin@hennebrpest.com', 'Mike Hennebry', 'ACTIVE');

-- Assign clients to service types
INSERT INTO client_assignments (client_id, user_id, service_type_id, role) 
SELECT 
  c.id,
  '550e8400-e29b-41d4-a716-446655440001',
  st.id,
  'PRIMARY'
FROM clients c
CROSS JOIN service_types st
WHERE c.organization_id = '550e8400-e29b-41d4-a716-446655440000'
AND st.organization_id = '550e8400-e29b-41d4-a716-446655440000'
AND st.slug = 'social';
```

---

## 🔧 MAINTENANCE PROCEDURES

```sql
-- Clean up old activity logs (retain 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM activity_logs 
  WHERE timestamp < CURRENT_DATE - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Archive completed deliverables older than 6 months
CREATE OR REPLACE FUNCTION archive_old_deliverables()
RETURNS INTEGER AS $
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE deliverables 
  SET status = 'ARCHIVED'
  WHERE status = 'COMPLETED' 
  AND completed_at < CURRENT_DATE - INTERVAL '6 months';
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$ LANGUAGE plpgsql;

-- Database health check
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS JSON AS $
DECLARE
  result JSON;
  table_sizes JSON;
  index_usage JSON;
BEGIN
  -- Get table sizes
  SELECT json_object_agg(table_name, size_mb) INTO table_sizes
  FROM (
    SELECT 
      schemaname||'.'||tablename as table_name,
      ROUND(pg_total_relation_size(schemaname||'.'||tablename) / 1024.0 / 1024.0, 2) as size_mb
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10
  ) t;
  
  result := json_build_object(
    'timestamp', CURRENT_TIMESTAMP,
    'total_organizations', (SELECT COUNT(*) FROM organizations),
    'total_users', (SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'),
    'total_clients', (SELECT COUNT(*) FROM clients WHERE status = 'ACTIVE'),
    'total_deliverables', (SELECT COUNT(*) FROM deliverables),
    'table_sizes_mb', table_sizes
  );
  
  RETURN result;
END;
$ LANGUAGE plpgsql;
```

---

## 📋 MIGRATION STRATEGY

```sql
-- Version tracking for schema migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Sample migration entries
INSERT INTO schema_migrations (version, description) VALUES
('001_initial_schema', 'Initial database schema with organizations, users, clients, deliverables'),
('002_service_types', 'Added flexible service type system'),
('003_custom_fields', 'Added custom field support for deliverables'),
('004_client_portal', 'Added client portal user system'),
('005_notifications', 'Added notification and activity logging'),
('006_integrations', 'Added integration system for external services');
```

This complete database schema provides the foundation for a fully scalable, multi-tenant agency operations platform. Every table includes proper relationships, constraints, and indexes for optimal performance while maintaining complete data isolation between organizations.