# TECHNICAL ARCHITECTURE - MYCELIUM OS
## Complete System Blueprint for Multi-Tenant Agency Operations Platform

---

## 🏗️ SYSTEM OVERVIEW

Mycelium OS is a multi-tenant SaaS platform designed for creative and digital marketing agencies. Every component must support unlimited organizations with complete data isolation, custom branding, and flexible service configurations.

---

## 🔐 AUTHENTICATION & SESSION MANAGEMENT

### Supabase Auth Implementation
```typescript
// Core Auth Configuration
const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
}

// Session Management
interface UserSession {
  user: {
    id: string;
    email: string;
    organizationId: string;
    role: UserRole;
    permissions: CustomPermissions;
    organizationSlug: string;
    organizationBranding: BrandingConfig;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

### Email Templates (Customizable)
- **Welcome Email**: Organization branding + custom messaging
- **Password Reset**: Branded reset flow with org colors
- **Invite Email**: Professional invite with temp password + setup instructions
- **Notification Emails**: Deliverable updates with org branding

### Session Security
- **Auto-refresh**: 24 hours for active users, 30 days with "remember me"
- **Multi-device**: Allow multiple active sessions per user
- **Session invalidation**: On password change, role change, or manual logout

---

## 🏢 MULTI-TENANT ARCHITECTURE

### Organization Isolation Strategy
```typescript
// Row Level Security (RLS) Enforcement
// Every table includes organization_id with RLS policies

CREATE POLICY "org_isolation_users" ON users
  FOR ALL USING (organization_id = auth.jwt() ->> 'organization_id'::uuid);

CREATE POLICY "org_isolation_clients" ON clients  
  FOR ALL USING (organization_id = auth.jwt() ->> 'organization_id'::uuid);

CREATE POLICY "org_isolation_deliverables" ON deliverables
  FOR ALL USING (organization_id = auth.jwt() ->> 'organization_id'::uuid);
```

### Organization Setup Flow
```typescript
interface OrganizationOnboarding {
  step1: BasicInfo; // Company name, admin email, admin name
  step2: ServiceTypes; // Select/create service offerings  
  step3: DeliverableTemplates; // Configure deliverable fields per service
  step4: BrandingSetup; // Primary color, logo upload, email templates
  step5: TeamInvites; // Initial team member invitations
  step6: IntegrationSetup; // Dropbox, Slack, optional integrations
}

// Dynamic Service Type Creation
interface ServiceTypeSetup {
  name: string; // "Social Media", "SEO", "Web Design", "Custom Service"
  defaultFields: DeliverableField[]; // Configurable field templates
  workflowType: 'recurring' | 'project' | 'milestone'; // Workflow pattern
  billingCycle?: 'monthly' | 'project' | 'hourly'; // Future billing integration
}

// Deliverable Field Configuration
interface DeliverableField {
  id: string;
  name: string; // "Due Date", "Dropbox Link", "Client Approval"
  type: 'text' | 'date' | 'url' | 'dropdown' | 'checkbox' | 'number';
  required: boolean;
  defaultValue?: string;
  options?: string[]; // For dropdown fields
}
```

### Branding System
```typescript
interface BrandingConfig {
  organizationId: string;
  primaryColor: string; // Hex color for UI theming
  secondaryColor?: string;
  logoUrl?: string; // Uploaded logo for client portal
  companyName: string;
  emailTemplates: {
    header: string; // Custom email header HTML
    footer: string; // Custom email footer HTML
    primaryColor: string; // Email accent color
  };
  clientPortalSettings: {
    welcomeMessage: string;
    supportEmail: string;
    customDomain?: string; // Future: client.agencyname.com
  };
}
```

---

## 👥 USER MANAGEMENT SYSTEM

### Role-Based Access Control
```typescript
enum UserRole {
  ADMIN = 'admin',                    // Full platform access
  VIDEO_EDITOR = 'video_editor',      // Social media deliverables only
  SEO_STRATEGIST = 'seo_strategist',  // SEO deliverables only
  WEBSITE_DESIGNER = 'website_designer', // Website deliverables only
  FILMER = 'filmer',                  // Filming tasks only
  CUSTOM = 'custom'                   // Configurable permissions
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'                 // Invited but not yet activated
}

interface CustomPermissions {
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
  canCreateDeliverables: boolean;
  canEditDeliverables: boolean;
  canDeleteDeliverables: boolean;
  canInviteUsers: boolean; // NEVER allowed for non-admin
  canEditUsers: boolean;   // NEVER allowed for non-admin
  canDeleteUsers: boolean; // NEVER allowed for non-admin
  serviceTypeAccess: ServiceType[]; // Which service types they can see
  clientAccess: 'assigned' | 'service_type' | 'all'; // Scope of client visibility
}
```

### User Invitation System
```typescript
interface UserInvitation {
  email: string;
  role: UserRole;
  permissions?: CustomPermissions; // Required if role is CUSTOM
  temporaryPassword: string; // Auto-generated secure password
  invitedBy: string; // Admin user ID
  expiresAt: Date; // 7 days expiration
  status: 'sent' | 'accepted' | 'expired';
  organizationId: string;
}

// Invitation Email Flow
const inviteUser = async (invitation: UserInvitation) => {
  // 1. Create pending user record
  // 2. Generate secure temporary password
  // 3. Send branded email with login credentials
  // 4. Force password change on first login
  // 5. Activate user account after password change
};
```

### Permission Validation
```typescript
const checkPermission = (user: User, action: string, resource: string): boolean => {
  // Admin users have all permissions except across organizations
  if (user.role === UserRole.ADMIN && user.organizationId === resource.organizationId) {
    return true;
  }
  
  // Service-specific role validation
  if (user.role === UserRole.VIDEO_EDITOR) {
    return resource.serviceType === 'social' && resource.assignedUserId === user.id;
  }
  
  // Custom user permission checking
  if (user.role === UserRole.CUSTOM) {
    return validateCustomPermissions(user.permissions, action, resource);
  }
  
  return false;
};
```

---

## 📊 CLIENT MANAGEMENT SYSTEM

### Client Data Structure
```typescript
interface Client {
  id: string;
  organizationId: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  serviceTypes: ServiceType[]; // Can have multiple services
  assignedUsers: UserAssignment[]; // Different users per service type
  status: ClientStatus;
  customFields: Record<string, any>; // Organization-specific fields
  settings: ClientSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface UserAssignment {
  userId: string;
  serviceType: ServiceType;
  role: 'primary' | 'secondary'; // Primary gets notifications
  assignedAt: Date;
}

interface ClientSettings {
  isPaused: boolean; // Pauses deliverable generation
  pausedAt?: Date;
  pausedReason?: string;
  notificationEmail?: string; // Override contact email for notifications
  dropboxFolderUrl?: string; // Client's main Dropbox folder
  customBranding?: {
    color: string;
    logo?: string;
  };
}

enum ClientStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived'
}
```

### Client Creation Flow
```typescript
const createClient = async (clientData: ClientCreationData) => {
  // 1. Validate user permissions (admin or custom with canCreateClients)
  // 2. Create client record with organization isolation
  // 3. Assign users to service types
  // 4. Generate initial deliverables based on service templates
  // 5. Send notification to assigned team members
  // 6. Log activity for audit trail
};

// Bulk Import Support
const importClientsFromCSV = async (csvData: string, organizationId: string) => {
  // 1. Parse CSV with validation
  // 2. Map fields to client structure
  // 3. Batch create clients with error handling
  // 4. Generate deliverables for each client
  // 5. Return import summary with success/failure counts
};
```

---

## 📋 DELIVERABLE MANAGEMENT SYSTEM

### Deliverable Structure
```typescript
interface Deliverable {
  id: string;
  organizationId: string;
  clientId: string;
  serviceType: ServiceType;
  title: string;
  description?: string;
  assignedUserId?: string;
  dueDate?: Date;
  status: DeliverableStatus;
  priority: Priority;
  customFields: Record<string, any>; // Dynamic fields per organization
  attachments: FileAttachment[];
  comments: Comment[];
  timeTracking: TimeEntry[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

enum DeliverableStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  NEEDS_REVIEW = 'needs_review',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

### Service-Specific Templates
```typescript
// Default Templates (Customizable per Organization)
const defaultTemplates = {
  social: {
    fields: [
      { name: 'deliverable_name', type: 'text', required: true },
      { name: 'edit_by_date', type: 'date', required: true },
      { name: 'dropbox_link', type: 'url', required: false },
      { name: 'notes', type: 'text', required: false },
      { name: 'assigned_team_member', type: 'user_select', required: true }
    ],
    workflowType: 'recurring',
    defaultDuration: 7 // days
  },
  seo: {
    fields: [
      { name: 'start_date', type: 'date', required: true },
      { name: 'checkup_frequency', type: 'dropdown', options: ['weekly', 'bi-weekly', 'monthly'], required: true },
      { name: 'end_date', type: 'date', required: true },
      { name: 'notes', type: 'text', required: false },
      { name: 'assigned_team_member', type: 'user_select', required: true }
    ],
    workflowType: 'project',
    defaultDuration: 30 // days
  },
  website: {
    fields: [
      { name: 'start_date', type: 'date', required: true },
      { name: 'checkup_frequency', type: 'dropdown', options: ['weekly', 'bi-weekly'], required: true },
      { name: 'launch_date', type: 'date', required: true },
      { name: 'notes', type: 'text', required: false },
      { name: 'assigned_team_member', type: 'user_select', required: true }
    ],
    workflowType: 'milestone',
    defaultDuration: 60 // days
  },
  oneoff: {
    fields: [
      { name: 'start_date', type: 'date', required: true },
      { name: 'end_date', type: 'date', required: true },
      { name: 'dropbox_link', type: 'url', required: false },
      { name: 'notes', type: 'text', required: false },
      { name: 'assigned_team_member', type: 'user_select', required: true }
    ],
    workflowType: 'project',
    defaultDuration: 14 // days
  }
};
```

### Deliverable Generation Engine
```typescript
const generateDeliverables = async (client: Client, month: Date) => {
  for (const serviceType of client.serviceTypes) {
    const template = await getServiceTemplate(client.organizationId, serviceType);
    const assignedUsers = client.assignedUsers.filter(u => u.serviceType === serviceType);
    
    switch (template.workflowType) {
      case 'recurring':
        await generateRecurringDeliverables(client, serviceType, template, month);
        break;
      case 'project':
        await generateProjectDeliverables(client, serviceType, template);
        break;
      case 'milestone':
        await generateMilestoneDeliverables(client, serviceType, template);
        break;
    }
  }
};

// Monthly Reset for Recurring Services
const monthlyDeliverableReset = async () => {
  const activeClients = await getActiveClients();
  const currentMonth = new Date();
  
  for (const client of activeClients) {
    if (!client.settings.isPaused) {
      await generateDeliverables(client, currentMonth);
    }
  }
};
```

---

## 📱 DASHBOARD SYSTEM

### User-Specific Dashboards
```typescript
interface DashboardData {
  user: User;
  organization: Organization;
  todaysTasks: Deliverable[];
  overdueTasks: Deliverable[];
  upcomingTasks: Deliverable[];
  recentActivity: ActivityItem[];
  teamMetrics?: TeamMetrics; // Only for admins/managers
  notifications: Notification[];
}

// Dashboard Permission Filtering
const getDashboardData = async (user: User): Promise<DashboardData> => {
  let deliverables: Deliverable[];
  
  switch (user.role) {
    case UserRole.ADMIN:
      deliverables = await getAllOrganizationDeliverables(user.organizationId);
      break;
    case UserRole.CUSTOM:
      deliverables = await getDeliverablesForCustomUser(user);
      break;
    default:
      deliverables = await getAssignedDeliverables(user.id);
  }
  
  return {
    todaysTasks: filterByDueDate(deliverables, 'today'),
    overdueTasks: filterByStatus(deliverables, 'overdue'),
    upcomingTasks: filterByDueDate(deliverables, 'upcoming'),
    // ... other dashboard data
  };
};
```

### Real-Time Updates
```typescript
// Supabase Real-time Subscriptions
const setupRealtimeSubscriptions = (user: User) => {
  // Subscribe to deliverable changes for assigned items
  supabase
    .channel('deliverables')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'deliverables',
      filter: `assigned_user_id=eq.${user.id}`
    }, handleDeliverableUpdate)
    .subscribe();
    
  // Subscribe to client changes if user has access
  if (user.role === UserRole.ADMIN || user.permissions?.canEditClients) {
    supabase
      .channel('clients')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'clients',
        filter: `organization_id=eq.${user.organizationId}`
      }, handleClientUpdate)
      .subscribe();
  }
};
```

---

## 🔔 NOTIFICATION SYSTEM

### Notification Channels
```typescript
interface NotificationConfig {
  organizationId: string;
  channels: {
    email: EmailNotificationSettings;
    slack: SlackNotificationSettings;
    inApp: InAppNotificationSettings;
  };
}

interface EmailNotificationSettings {
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  types: NotificationType[];
  template: 'default' | 'custom';
  fromAddress?: string; // Custom sender for white-label
}

interface SlackNotificationSettings {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  frequency: 'immediate' | 'daily';
  types: NotificationType[];
}

enum NotificationType {
  DELIVERABLE_DUE = 'deliverable_due',
  DELIVERABLE_OVERDUE = 'deliverable_overdue', 
  DELIVERABLE_COMPLETED = 'deliverable_completed',
  CLIENT_ADDED = 'client_added',
  USER_INVITED = 'user_invited',
  INTEGRATION_ERROR = 'integration_error'
}
```

### Notification Processing
```typescript
const processNotifications = async () => {
  const notifications = await getPendingNotifications();
  
  for (const notification of notifications) {
    const org = await getOrganization(notification.organizationId);
    const config = org.notificationConfig;
    
    // Email notifications
    if (config.channels.email.enabled) {
      await sendEmailNotification(notification, config.channels.email);
    }
    
    // Slack notifications
    if (config.channels.slack.enabled) {
      await sendSlackNotification(notification, config.channels.slack);
    }
    
    // In-app notifications
    await createInAppNotification(notification);
    
    await markNotificationSent(notification.id);
  }
};

// Anti-spam Protection
const shouldSendNotification = (user: User, type: NotificationType): boolean => {
  const recentNotifications = getRecentNotifications(user.id, type, '1 hour');
  const maxPerHour = getSpamLimits(type);
  
  return recentNotifications.length < maxPerHour;
};
```

---

## 🔗 INTEGRATION SYSTEM

### Dropbox Integration
```typescript
interface DropboxIntegration {
  organizationId: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  rootFolderPath: string; // Organization's main folder
  autoNotifications: boolean; // Auto-notify on file upload
  clientFolderStructure: 'flat' | 'nested'; // Folder organization preference
}

const setupClientDropboxFolder = async (client: Client) => {
  const integration = await getDropboxIntegration(client.organizationId);
  const folderPath = `${integration.rootFolderPath}/${client.name}`;
  
  // Create client folder structure
  await createDropboxFolder(`${folderPath}/Final Deliverables`);
  await createDropboxFolder(`${folderPath}/Raw Files`);
  await createDropboxFolder(`${folderPath}/Archive`);
  
  // Set up webhook for file change notifications
  await setupDropboxWebhook(folderPath, client.id);
};
```

### Slack Integration
```typescript
interface SlackIntegration {
  organizationId: string;
  webhookUrl: string;
  defaultChannel: string;
  userMentions: Record<string, string>; // userId -> slackUserId mapping
  customMessages: Record<NotificationType, string>;
}

const sendSlackNotification = async (notification: Notification, config: SlackNotificationSettings) => {
  const message = formatSlackMessage(notification, config);
  
  await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: config.channel,
      text: message.text,
      attachments: message.attachments,
      username: 'Mycelium OS'
    })
  });
};
```

---

## 📊 ANALYTICS & REPORTING

### Organization Metrics
```typescript
interface OrganizationMetrics {
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  metrics: {
    totalDeliverables: number;
    completedDeliverables: number;
    overdueDeliverables: number;
    averageCompletionTime: number; // hours
    teamProductivity: TeamProductivityMetric[];
    clientSatisfaction?: number; // Future: client feedback scores
    serviceTypeBreakdown: ServiceTypeMetric[];
  };
  generatedAt: Date;
}

interface TeamProductivityMetric {
  userId: string;
  userName: string;
  completedTasks: number;
  averageTaskTime: number;
  overdueCount: number;
  productivityScore: number; // 0-100
}

interface ServiceTypeMetric {
  serviceType: ServiceType;
  totalDeliverables: number;
  completedDeliverables: number;
  averageTimeToComplete: number;
  clientCount: number;
}
```

### Reporting API Endpoints
```typescript
// GET /api/analytics/organization/:orgId/overview
const getOrganizationOverview = async (orgId: string, period: string) => {
  return {
    totalClients: await getClientCount(orgId),
    activeProjects: await getActiveProjectCount(orgId),
    teamMembers: await getTeamMemberCount(orgId),
    completionRate: await getCompletionRate(orgId, period),
    upcomingDeadlines: await getUpcomingDeadlines(orgId),
    recentActivity: await getRecentActivity(orgId, 10)
  };
};

// GET /api/analytics/user/:userId/performance
const getUserPerformance = async (userId: string, period: string) => {
  return {
    assignedTasks: await getAssignedTaskCount(userId, period),
    completedTasks: await getCompletedTaskCount(userId, period),
    overdueCount: await getOverdueCount(userId),
    averageCompletionTime: await getAverageCompletionTime(userId, period),
    topClients: await getTopClientsByWork(userId, period)
  };
};
```

---

## 🚀 API ARCHITECTURE

### RESTful API Design
```typescript
// Client Management Endpoints
GET    /api/clients                    // List clients (filtered by permissions)
POST   /api/clients                    // Create new client
GET    /api/clients/:id                // Get client details
PUT    /api/clients/:id                // Update client
DELETE /api/clients/:id                // Delete client
POST   /api/clients/import            // Bulk import from CSV

// Deliverable Management
GET    /api/deliverables               // List deliverables (filtered by user)
POST   /api/deliverables               // Create deliverable
GET    /api/deliverables/:id           // Get deliverable details  
PUT    /api/deliverables/:id           // Update deliverable
DELETE /api/deliverables/:id           // Delete deliverable
POST   /api/deliverables/:id/complete  // Mark as complete
POST   /api/deliverables/:id/comments  // Add comment

// User Management (Admin only)
GET    /api/users                      // List organization users
POST   /api/users/invite               // Invite new user
PUT    /api/users/:id                  // Update user
DELETE /api/users/:id                  // Delete/deactivate user
POST   /api/users/:id/permissions      // Update permissions

// Organization Management
GET    /api/organization               // Get current org details
PUT    /api/organization               // Update org settings
POST   /api/organization/branding      // Update branding
GET    /api/organization/analytics     // Get metrics
```

### Error Handling
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId: string;
}

// Standard Error Responses
const errorResponses = {
  400: { code: 'BAD_REQUEST', message: 'Invalid request data' },
  401: { code: 'UNAUTHORIZED', message: 'Authentication required' },
  403: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
  404: { code: 'NOT_FOUND', message: 'Resource not found' },
  409: { code: 'CONFLICT', message: 'Resource already exists' },
  422: { code: 'VALIDATION_ERROR', message: 'Invalid input data' },
  500: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
};
```

---

## 📱 CLIENT PORTAL ARCHITECTURE

### Client Authentication
```typescript
// Separate auth system for clients
interface ClientUser {
  id: string;
  clientId: string;
  email: string;
  name: string;
  role: 'primary' | 'viewer'; // Primary can approve, viewer is read-only
  lastLogin?: Date;
  isActive: boolean;
}

// Client portal permissions (read-only)
const clientPortalPermissions = {
  canViewProjects: true,
  canViewDeliverables: true,
  canDownloadFiles: true,
  canApproveWork: true, // Only for primary client users
  canViewInvoices: false, // Future feature
  canEditProfile: true
};
```

### Client Portal Features
```typescript
interface ClientPortalData {
  client: Client;
  activeProjects: Project[];
  recentDeliverables: Deliverable[];
  upcomingDeadlines: Deliverable[];
  fileAccess: FileAccessItem[];
  notifications: ClientNotification[];
  organizationBranding: BrandingConfig;
}

// White-label portal theming
const getPortalTheme = (organizationId: string) => {
  const branding = await getOrganizationBranding(organizationId);
  return {
    primaryColor: branding.primaryColor,
    logo: branding.logoUrl,
    companyName: branding.companyName,
    customCSS: branding.customPortalCSS
  };
};
```

---

This technical architecture provides the complete blueprint for building Mycelium OS. Every component is designed for multi-tenant operation, scalability, and flexibility while maintaining the specific workflows that creative agencies need to operate efficiently.