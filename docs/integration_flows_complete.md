# INTEGRATION FLOWS - MYCELIUM OS
## Complete External Service Integration Architecture

---

## 🔗 INTEGRATION OVERVIEW

Mycelium OS integrates with external services to create seamless workflows for creative agencies. Every integration maintains organization-level isolation, handles authentication securely, and provides robust error handling with retry mechanisms.

---

## 📦 DROPBOX INTEGRATION

### OAuth 2.0 Authentication Flow
```typescript
// Dropbox App Configuration
const dropboxConfig = {
  clientId: process.env.DROPBOX_CLIENT_ID,
  clientSecret: process.env.DROPBOX_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/api/integrations/dropbox/callback`,
  scopes: [
    'files.metadata.write',
    'files.content.write',
    'files.content.read',
    'sharing.write',
    'sharing.read'
  ]
};

// Step 1: Initiate OAuth Flow
const initiateDropboxAuth = async (organizationId: string) => {
  const state = generateSecureState(organizationId);
  const authUrl = `https://www.dropbox.com/oauth2/authorize?` + 
    `client_id=${dropboxConfig.clientId}&` +
    `redirect_uri=${encodeURIComponent(dropboxConfig.redirectUri)}&` +
    `response_type=code&` +
    `state=${state}&` +
    `scope=${dropboxConfig.scopes.join(' ')}`;
  
  // Store state in session for verification
  await storeOAuthState(state, organizationId);
  
  return authUrl;
};

// Step 2: Handle OAuth Callback
const handleDropboxCallback = async (code: string, state: string) => {
  // Verify state parameter
  const organizationId = await verifyOAuthState(state);
  if (!organizationId) {
    throw new Error('Invalid OAuth state');
  }
  
  // Exchange code for access token
  const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: dropboxConfig.clientId,
      client_secret: dropboxConfig.clientSecret,
      redirect_uri: dropboxConfig.redirectUri
    })
  });
  
  const tokens = await tokenResponse.json();
  
  // Encrypt and store tokens
  await storeDropboxTokens(organizationId, {
    accessToken: encrypt(tokens.access_token),
    refreshToken: encrypt(tokens.refresh_token),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
  });
  
  // Test connection and setup folder structure
  await setupDropboxIntegration(organizationId);
  
  return { success: true, organizationId };
};
```

### Folder Structure Management
```typescript
interface DropboxFolderStructure {
  organizationRoot: string; // "/MyceliumOS-AgencyName"
  clientFolders: {
    pattern: string; // "/MyceliumOS-AgencyName/Clients/{clientName}"
    subfolders: string[]; // ["Final Deliverables", "Work in Progress", "Raw Files", "Archive"]
  };
  teamFolders: {
    pattern: string; // "/MyceliumOS-AgencyName/Team/{serviceType}"
    templates: boolean; // Auto-create template folders
  };
}

const setupOrganizationDropboxStructure = async (organizationId: string, accessToken: string) => {
  const org = await getOrganization(organizationId);
  const rootPath = `/MyceliumOS-${org.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // Create organization root folder
  await createDropboxFolder(accessToken, rootPath);
  
  // Create main organizational folders
  const mainFolders = [
    `${rootPath}/Clients`,
    `${rootPath}/Team Resources`,
    `${rootPath}/Templates`,
    `${rootPath}/Archive`
  ];
  
  for (const folder of mainFolders) {
    await createDropboxFolder(accessToken, folder);
  }
  
  // Set up team service folders
  const serviceTypes = await getServiceTypes(organizationId);
  for (const service of serviceTypes) {
    await createDropboxFolder(accessToken, `${rootPath}/Team Resources/${service.name}`);
    await createDropboxFolder(accessToken, `${rootPath}/Templates/${service.name}`);
  }
  
  // Store configuration
  await updateIntegrationConfig(organizationId, 'dropbox', {
    rootPath,
    folderStructure: 'organized',
    autoCreateClientFolders: true
  });
};

const createClientDropboxFolder = async (client: Client) => {
  const integration = await getDropboxIntegration(client.organizationId);
  if (!integration.isEnabled) return;
  
  const clientPath = `${integration.config.rootPath}/Clients/${client.name}`;
  const accessToken = decrypt(integration.config.accessToken);
  
  // Create client root folder
  await createDropboxFolder(accessToken, clientPath);
  
  // Create standard subfolders
  const subfolders = [
    'Final Deliverables',
    'Work in Progress', 
    'Raw Files',
    'Archive',
    'Client Resources'
  ];
  
  for (const subfolder of subfolders) {
    await createDropboxFolder(accessToken, `${clientPath}/${subfolder}`);
  }
  
  // Create service-specific folders
  const serviceTypes = client.serviceTypes;
  for (const service of serviceTypes) {
    await createDropboxFolder(accessToken, `${clientPath}/Final Deliverables/${service.name}`);
    await createDropboxFolder(accessToken, `${clientPath}/Work in Progress/${service.name}`);
  }
  
  // Generate shareable links for team access
  const teamLinks = await generateDropboxTeamLinks(accessToken, clientPath);
  
  // Store folder information in client record
  await updateClient(client.id, {
    dropboxFolderPath: clientPath,
    dropboxTeamLinks: teamLinks
  });
  
  // Notify assigned team members
  await notifyTeamOfNewClientFolder(client, teamLinks);
};
```

### File Upload & Management
```typescript
interface DropboxFileOperation {
  organizationId: string;
  clientId: string;
  deliverableId?: string;
  filePath: string;
  fileContent: Buffer;
  metadata: {
    uploadedBy: string;
    deliverableTitle?: string;
    serviceType: string;
    isClientVisible: boolean;
  };
}

const uploadFileToDropbox = async (operation: DropboxFileOperation) => {
  const integration = await getDropboxIntegration(operation.organizationId);
  const accessToken = decrypt(integration.config.accessToken);
  
  // Determine upload path based on file type and deliverable status
  const uploadPath = determineUploadPath(operation);
  
  // Upload file to Dropbox
  const uploadResult = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({
        path: uploadPath,
        mode: 'add',
        autorename: true,
        mute: false
      }),
      'Content-Type': 'application/octet-stream'
    },
    body: operation.fileContent
  });
  
  const fileMetadata = await uploadResult.json();
  
  // Generate shareable link if client-visible
  let shareableLink = null;
  if (operation.metadata.isClientVisible) {
    shareableLink = await createDropboxShareableLink(accessToken, fileMetadata.path_display);
  }
  
  // Store file reference in deliverable
  if (operation.deliverableId) {
    await addFileToDeliverable(operation.deliverableId, {
      fileName: fileMetadata.name,
      filePath: fileMetadata.path_display,
      fileSize: fileMetadata.size,
      shareableLink,
      uploadedBy: operation.metadata.uploadedBy,
      uploadedAt: new Date(),
      dropboxFileId: fileMetadata.id
    });
  }
  
  // Send notification about file upload
  await notifyFileUpload(operation, fileMetadata, shareableLink);
  
  return {
    success: true,
    fileId: fileMetadata.id,
    filePath: fileMetadata.path_display,
    shareableLink
  };
};

const determineUploadPath = (operation: DropboxFileOperation): string => {
  const basePath = getClientDropboxPath(operation.clientId);
  const { isClientVisible, serviceType } = operation.metadata;
  
  if (isClientVisible) {
    return `${basePath}/Final Deliverables/${serviceType}/${operation.filePath}`;
  } else {
    return `${basePath}/Work in Progress/${serviceType}/${operation.filePath}`;
  }
};
```

### Webhook Integration
```typescript
// Dropbox Webhook Handler
const handleDropboxWebhook = async (req: Request, res: Response) => {
  // Verify webhook signature
  const signature = req.headers['x-dropbox-signature'] as string;
  const isValid = verifyDropboxWebhookSignature(req.body, signature);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook events
  const { list_folder, delta } = req.body;
  
  for (const account of list_folder.accounts) {
    await processDropboxAccountChanges(account);
  }
  
  res.status(200).json({ success: true });
};

const processDropboxAccountChanges = async (account: any) => {
  // Get organization from Dropbox account ID
  const integration = await getIntegrationByDropboxAccountId(account);
  if (!integration) return;
  
  const accessToken = decrypt(integration.config.accessToken);
  
  // List changes since last cursor
  const changesResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cursor: integration.config.lastCursor || account.cursor
    })
  });
  
  const changes = await changesResponse.json();
  
  // Process each file change
  for (const entry of changes.entries) {
    await processFileChange(integration.organizationId, entry);
  }
  
  // Update cursor for next webhook
  await updateIntegrationConfig(integration.organizationId, 'dropbox', {
    ...integration.config,
    lastCursor: changes.cursor
  });
};

const processFileChange = async (organizationId: string, fileEntry: any) => {
  // Determine if file is in a client folder
  const clientMatch = fileEntry.path_display.match(/\/Clients\/([^\/]+)\//);
  if (!clientMatch) return;
  
  const clientName = clientMatch[1];
  const client = await getClientByName(organizationId, clientName);
  if (!client) return;
  
  // Determine change type and notify accordingly
  if (fileEntry['.tag'] === 'file') {
    // File added or modified
    await notifyFileChange(client, fileEntry, 'added');
  } else if (fileEntry['.tag'] === 'deleted') {
    // File deleted
    await notifyFileChange(client, fileEntry, 'deleted');
  }
};
```

---

## 💬 SLACK INTEGRATION

### Slack App Installation
```typescript
// Slack App Configuration
const slackConfig = {
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/api/integrations/slack/callback`,
  scopes: [
    'incoming-webhook',
    'chat:write',
    'chat:write.public',
    'channels:read',
    'users:read',
    'users:read.email'
  ]
};

// OAuth Installation Flow
const initiateSlackInstall = async (organizationId: string) => {
  const state = generateSecureState(organizationId);
  const installUrl = `https://slack.com/oauth/v2/authorize?` +
    `client_id=${slackConfig.clientId}&` +
    `scope=${slackConfig.scopes.join(',')}&` +
    `redirect_uri=${encodeURIComponent(slackConfig.redirectUri)}&` +
    `state=${state}`;
    
  await storeOAuthState(state, organizationId);
  return installUrl;
};

const handleSlackCallback = async (code: string, state: string) => {
  const organizationId = await verifyOAuthState(state);
  
  // Exchange code for access token
  const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: slackConfig.clientId,
      client_secret: slackConfig.clientSecret,
      code,
      redirect_uri: slackConfig.redirectUri
    })
  });
  
  const tokenData = await tokenResponse.json();
  
  if (!tokenData.ok) {
    throw new Error(`Slack OAuth error: ${tokenData.error}`);
  }
  
  // Store Slack workspace information
  await storeSlackIntegration(organizationId, {
    teamId: tokenData.team.id,
    teamName: tokenData.team.name,
    accessToken: encrypt(tokenData.access_token),
    webhookUrl: encrypt(tokenData.incoming_webhook.url),
    webhookChannel: tokenData.incoming_webhook.channel,
    webhookChannelId: tokenData.incoming_webhook.channel_id,
    botUserId: tokenData.bot_user_id,
    installerUserId: tokenData.authed_user.id
  });
  
  // Test the integration
  await sendSlackTestMessage(organizationId);
  
  return { success: true, teamName: tokenData.team.name };
};
```

### Notification Message Formatting
```typescript
interface SlackNotificationConfig {
  organizationId: string;
  notificationType: NotificationType;
  data: any;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
}

const sendSlackNotification = async (config: SlackNotificationConfig) => {
  const integration = await getSlackIntegration(config.organizationId);
  if (!integration.isEnabled) return;
  
  const message = formatSlackMessage(config);
  const webhookUrl = decrypt(integration.config.webhookUrl);
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
  
  if (!response.ok) {
    await logIntegrationError(config.organizationId, 'slack', 'Failed to send notification');
    throw new Error('Failed to send Slack notification');
  }
  
  await logIntegrationActivity(config.organizationId, 'slack', 'notification_sent', config.notificationType);
};

const formatSlackMessage = (config: SlackNotificationConfig) => {
  const org = getOrganizationBranding(config.organizationId);
  
  switch (config.notificationType) {
    case 'DELIVERABLE_DUE_SOON':
      return {
        text: `⏰ Deliverable Due Soon`,
        attachments: [{
          color: '#ff9500',
          title: config.data.deliverable.title,
          title_link: `${process.env.APP_URL}/deliverables/${config.data.deliverable.id}`,
          fields: [
            {
              title: 'Client',
              value: config.data.client.name,
              short: true
            },
            {
              title: 'Due Date',
              value: formatDate(config.data.deliverable.dueDate),
              short: true
            },
            {
              title: 'Assigned To',
              value: `<@${config.data.assignedUser.slackUserId}>`,
              short: true
            },
            {
              title: 'Priority',
              value: config.data.deliverable.priority.toUpperCase(),
              short: true
            }
          ],
          footer: org.companyName,
          footer_icon: org.logoUrl,
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
    case 'DELIVERABLE_OVERDUE':
      return {
        text: `🚨 Overdue Deliverable Alert`,
        attachments: [{
          color: '#ff3333',
          title: config.data.deliverable.title,
          title_link: `${process.env.APP_URL}/deliverables/${config.data.deliverable.id}`,
          fields: [
            {
              title: 'Client',
              value: config.data.client.name,
              short: true
            },
            {
              title: 'Was Due',
              value: formatDate(config.data.deliverable.dueDate),
              short: true
            },
            {
              title: 'Assigned To',
              value: `<@${config.data.assignedUser.slackUserId}>`,
              short: true
            },
            {
              title: 'Days Overdue',
              value: calculateDaysOverdue(config.data.deliverable.dueDate).toString(),
              short: true
            }
          ],
          actions: [
            {
              type: 'button',
              text: 'View Deliverable',
              url: `${process.env.APP_URL}/deliverables/${config.data.deliverable.id}`,
              style: 'primary'
            },
            {
              type: 'button',
              text: 'Reassign',
              url: `${process.env.APP_URL}/deliverables/${config.data.deliverable.id}/edit`,
              style: 'default'
            }
          ],
          footer: org.companyName,
          footer_icon: org.logoUrl,
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
    case 'DELIVERABLE_COMPLETED':
      return {
        text: `✅ Deliverable Completed`,
        attachments: [{
          color: '#28a745',
          title: config.data.deliverable.title,
          title_link: `${process.env.APP_URL}/deliverables/${config.data.deliverable.id}`,
          fields: [
            {
              title: 'Client',
              value: config.data.client.name,
              short: true
            },
            {
              title: 'Completed By',
              value: `<@${config.data.completedBy.slackUserId}>`,
              short: true
            },
            {
              title: 'Service Type',
              value: config.data.deliverable.serviceType,
              short: true
            },
            {
              title: 'Completion Time',
              value: calculateCompletionTime(config.data.deliverable),
              short: true
            }
          ],
          footer: org.companyName,
          footer_icon: org.logoUrl,
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
    case 'NEW_CLIENT_ADDED':
      return {
        text: `🎉 New Client Added`,
        attachments: [{
          color: org.primaryColor,
          title: config.data.client.name,
          title_link: `${process.env.APP_URL}/clients/${config.data.client.id}`,
          fields: [
            {
              title: 'Contact Person',
              value: config.data.client.contactPerson,
              short: true
            },
            {
              title: 'Service Types',
              value: config.data.client.serviceTypes.map(s => s.name).join(', '),
              short: true
            },
            {
              title: 'Added By',
              value: `<@${config.data.addedBy.slackUserId}>`,
              short: true
            },
            {
              title: 'Initial Deliverables',
              value: `${config.data.deliverables.length} created`,
              short: true
            }
          ],
          footer: org.companyName,
          footer_icon: org.logoUrl,
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
    default:
      return {
        text: `📢 ${config.notificationType}`,
        attachments: [{
          color: org.primaryColor,
          text: JSON.stringify(config.data, null, 2),
          footer: org.companyName,
          footer_icon: org.logoUrl,
          ts: Math.floor(Date.now() / 1000)
        }]
      };
  }
};
```

### User Mapping & Mentions
```typescript
const syncSlackUsers = async (organizationId: string) => {
  const integration = await getSlackIntegration(organizationId);
  const accessToken = decrypt(integration.config.accessToken);
  
  // Get Slack workspace users
  const slackUsersResponse = await fetch('https://slack.com/api/users.list', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const slackUsers = await slackUsersResponse.json();
  
  if (!slackUsers.ok) {
    throw new Error('Failed to fetch Slack users');
  }
  
  // Match Slack users with Mycelium users by email
  const myceliumUsers = await getOrganizationUsers(organizationId);
  const userMappings = [];
  
  for (const myceliumUser of myceliumUsers) {
    const matchingSlackUser = slackUsers.members.find(
      (slackUser: any) => slackUser.profile.email === myceliumUser.email
    );
    
    if (matchingSlackUser && !matchingSlackUser.deleted && !matchingSlackUser.is_bot) {
      userMappings.push({
        myceliumUserId: myceliumUser.id,
        slackUserId: matchingSlackUser.id,
        slackUsername: matchingSlackUser.name,
        email: myceliumUser.email
      });
    }
  }
  
  // Store user mappings
  await storeSlackUserMappings(organizationId, userMappings);
  
  return userMappings;
};

const getSlackMentionForUser = async (organizationId: string, userId: string): Promise<string> => {
  const mapping = await getSlackUserMapping(organizationId, userId);
  return mapping ? `<@${mapping.slackUserId}>` : 'Team Member';
};
```

### Slack Commands (Future Enhancement)
```typescript
// Slash Command Handler
const handleSlackCommand = async (req: Request, res: Response) => {
  const { token, team_id, user_id, command, text } = req.body;
  
  // Verify request is from Slack
  if (token !== process.env.SLACK_VERIFICATION_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Get organization from Slack team ID
  const integration = await getIntegrationBySlackTeamId(team_id);
  if (!integration) {
    return res.json({
      text: 'This Slack workspace is not connected to Mycelium OS',
      response_type: 'ephemeral'
    });
  }
  
  // Get Mycelium user from Slack user ID
  const userMapping = await getMyceliumUserBySlackId(integration.organizationId, user_id);
  if (!userMapping) {
    return res.json({
      text: 'Your Slack account is not linked to a Mycelium OS user',
      response_type: 'ephemeral'
    });
  }
  
  // Process command
  const response = await processSlackCommand(command, text, userMapping, integration.organizationId);
  
  res.json(response);
};

const processSlackCommand = async (command: string, text: string, user: any, organizationId: string) => {
  const args = text.trim().split(' ');
  
  switch (command) {
    case '/mycelium-tasks':
      return await getSlackTaskList(user.id, organizationId);
      
    case '/mycelium-overdue':
      return await getSlackOverdueList(user.id, organizationId);
      
    case '/mycelium-client':
      const clientName = args.join(' ');
      return await getSlackClientInfo(clientName, organizationId);
      
    case '/mycelium-complete':
      const deliverableId = args[0];
      return await completeDeliverableFromSlack(deliverableId, user.id, organizationId);
      
    default:
      return {
        text: 'Unknown command. Available commands: tasks, overdue, client [name], complete [id]',
        response_type: 'ephemeral'
      };
  }
};
```

---

## 📧 EMAIL INTEGRATION (SMTP)

### SMTP Configuration
```typescript
interface SMTPConfig {
  provider: 'gmail' | 'outlook' | 'sendgrid' | 'mailgun' | 'custom';
  host: string;
  port: number;
  secure: boolean; // TLS/SSL
  auth: {
    user: string;
    pass: string; // Encrypted
  };
  fromAddress: string;
  fromName: string;
  replyTo?: string;
}

const setupSMTPIntegration = async (organizationId: string, config: SMTPConfig) => {
  // Encrypt sensitive data
  const encryptedConfig = {
    ...config,
    auth: {
      user: config.auth.user,
      pass: encrypt(config.auth.pass)
    }
  };
  
  // Test SMTP connection
  const testResult = await testSMTPConnection(encryptedConfig);
  if (!testResult.success) {
    throw new Error(`SMTP test failed: ${testResult.error}`);
  }
  
  // Store configuration
  await storeEmailIntegration(organizationId, {
    type: 'smtp',
    config: encryptedConfig,
    isEnabled: true,
    lastTestAt: new Date(),
    status: 'connected'
  });
  
  // Send welcome email to admin
  await sendWelcomeEmail(organizationId);
  
  return { success: true, provider: config.provider };
};

const testSMTPConnection = async (config: SMTPConfig): Promise<{success: boolean, error?: string}> => {
  try {
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: decrypt(config.auth.pass)
      }
    });
    
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Branded Email Templates
```typescript
interface EmailTemplate {
  organizationId: string;
  type: EmailTemplateType;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[]; // Available template variables
}

enum EmailTemplateType {
  USER_INVITATION = 'user_invitation',
  PASSWORD_RESET = 'password_reset',
  DELIVERABLE_DUE = 'deliverable_due',
  DELIVERABLE_OVERDUE = 'deliverable_overdue',
  DELIVERABLE_COMPLETED = 'deliverable_completed',
  CLIENT_WELCOME = 'client_welcome',
  WEEKLY_DIGEST = 'weekly_digest',
  MONTHLY_REPORT = 'monthly_report'
}

const generateBrandedEmailTemplate = async (organizationId: string, templateType: EmailTemplateType, variables: Record<string, any>) => {
  const branding = await getOrganizationBranding(organizationId);
  const template = await getEmailTemplate(organizationId, templateType);
  
  // Default template if none customized
  if (!template) {
    template = getDefaultEmailTemplate(templateType);
  }
  
  // Replace variables in template
  let htmlContent = template.htmlContent;
  let textContent = template.textContent;
  let subject = template.subject;
  
  // Apply branding variables
  const brandingVariables = {
    '{{organization_name}}': branding.companyName,
    '{{organization_logo}}': branding.logoUrl,
    '{{primary_color}}': branding.primaryColor,
    '{{app_url}}': process.env.APP_URL,
    '{{support_email}}': branding.emailTemplates?.supportEmail || 'support@myceliumos.com'
  };
  
  // Apply all variables
  const allVariables = { ...brandingVariables, ...variables };
  
  for (const [key, value] of Object.entries(allVariables)) {
    const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
    htmlContent = htmlContent.replace(regex, value);
    textContent = textContent.replace(regex, value);
    subject = subject.replace(regex, value);
  }
  
  return {
    subject,
    htmlContent: applyEmailLayout(htmlContent, branding),
    textContent
  };
};

const applyEmailLayout = (content: string, branding: any) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${branding.companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: ${branding.primaryColor}; padding: 20px; text-align: center; }
    .header img { max-height: 40px; }
    .content { padding: 40px 30px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
    .button { display: inline-block; background: ${branding.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.companyName}">` : `<h1 style="color: white; margin: 0;">${branding.companyName}</h1>`}
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by ${branding.companyName} via Mycelium OS</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{app_url}}">Login to Dashboard</a></p>
    </div>
  </div>
</body>
</html>`;
};
```

### Email Queue & Delivery Management
```typescript
interface EmailJob {
  id: string;
  organizationId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  templateType: EmailTemplateType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
  createdAt: Date;
  sentAt?: Date;
  errorMessage?: string;
}

const queueEmail = async (emailData: Omit<EmailJob, 'id' | 'retryCount' | 'status' | 'createdAt'>) => {
  const emailJob: EmailJob = {
    ...emailData,
    id: generateId(),
    retryCount: 0,
    status: 'pending',
    createdAt: new Date()
  };
  
  // Add to email queue
  await addToEmailQueue(emailJob);
  
  // Process immediately if high priority, otherwise wait for batch processing
  if (emailJob.priority === 'urgent' || emailJob.priority === 'high') {
    await processEmailJob(emailJob);
  }
  
  return emailJob.id;
};

const processEmailQueue = async () => {
  const pendingEmails = await getPendingEmails();
  
  for (const email of pendingEmails) {
    try {
      await processEmailJob(email);
    } catch (error) {
      console.error(`Failed to process email ${email.id}:`, error);
      await handleEmailFailure(email, error.message);
    }
  }
};

const processEmailJob = async (emailJob: EmailJob) => {
  const integration = await getEmailIntegration(emailJob.organizationId);
  if (!integration.isEnabled) {
    throw new Error('Email integration not enabled');
  }
  
  const transporter = await createSMTPTransporter(integration.config);
  
  // Apply rate limiting
  await enforceRateLimit(emailJob.organizationId);
  
  // Send email
  const result = await transporter.sendMail({
    from: `${integration.config.fromName} <${integration.config.fromAddress}>`,
    to: emailJob.to,
    cc: emailJob.cc,
    bcc: emailJob.bcc,
    subject: emailJob.subject,
    html: emailJob.htmlContent,
    text: emailJob.textContent,
    replyTo: integration.config.replyTo
  });
  
  // Update email status
  await updateEmailJob(emailJob.id, {
    status: 'sent',
    sentAt: new Date(),
    metadata: {
      ...emailJob.metadata,
      messageId: result.messageId,
      response: result.response
    }
  });
  
  // Log delivery analytics
  await logEmailDelivery(emailJob.organizationId, emailJob.templateType, 'sent');
};

const handleEmailFailure = async (emailJob: EmailJob, errorMessage: string) => {
  const newRetryCount = emailJob.retryCount + 1;
  
  if (newRetryCount <= emailJob.maxRetries) {
    // Schedule retry with exponential backoff
    const retryDelay = Math.pow(2, newRetryCount) * 60000; // 2^n minutes
    const retryAt = new Date(Date.now() + retryDelay);
    
    await updateEmailJob(emailJob.id, {
      retryCount: newRetryCount,
      scheduledFor: retryAt,
      errorMessage
    });
  } else {
    // Mark as permanently failed
    await updateEmailJob(emailJob.id, {
      status: 'failed',
      errorMessage
    });
    
    // Notify admin of email failure
    await notifyEmailFailure(emailJob.organizationId, emailJob, errorMessage);
  }
  
  // Log failure analytics
  await logEmailDelivery(emailJob.organizationId, emailJob.templateType, 'failed');
};
```

---

## 📅 CALENDAR INTEGRATION

### Google Calendar Setup
```typescript
interface CalendarIntegration {
  organizationId: string;
  provider: 'google' | 'outlook' | 'apple';
  credentials: {
    accessToken: string; // Encrypted
    refreshToken: string; // Encrypted
    expiresAt: Date;
  };
  calendarId?: string; // Primary calendar or specific calendar
  syncSettings: {
    syncDeadlines: boolean;
    syncMeetings: boolean;
    createEvents: boolean;
    reminderMinutes: number;
  };
}

const setupGoogleCalendarIntegration = async (organizationId: string, authCode: string) => {
  // Exchange auth code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: authCode,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.APP_URL}/api/integrations/calendar/callback`,
      grant_type: 'authorization_code'
    })
  });
  
  const tokens = await tokenResponse.json();
  
  // Store integration
  await storeCalendarIntegration(organizationId, {
    provider: 'google',
    credentials: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
    },
    syncSettings: {
      syncDeadlines: true,
      syncMeetings: false,
      createEvents: true,
      reminderMinutes: 60
    }
  });
  
  // Sync existing deliverable deadlines
  await syncDeliveryDeadlines(organizationId);
  
  return { success: true };
};

const syncDeliveryDeadlines = async (organizationId: string) => {
  const integration = await getCalendarIntegration(organizationId);
  if (!integration.syncSettings.syncDeadlines) return;
  
  const upcomingDeliverables = await getUpcomingDeliverables(organizationId, 30); // Next 30 days
  
  for (const deliverable of upcomingDeliverables) {
    await createCalendarEvent(integration, {
      summary: `📋 ${deliverable.title}`,
      description: `Client: ${deliverable.client.name}\nService: ${deliverable.serviceType.name}\nAssigned to: ${deliverable.assignedUser?.name}`,
      start: {
        dateTime: deliverable.dueDate.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: new Date(deliverable.dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: 'America/New_York'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: integration.syncSettings.reminderMinutes },
          { method: 'popup', minutes: 15 }
        ]
      },
      attendees: deliverable.assignedUser ? [{ email: deliverable.assignedUser.email }] : []
    });
  }
};
```

### Meeting Scheduling
```typescript
const scheduleClientMeeting = async (deliverableId: string, meetingDetails: {
  title: string;
  description?: string;
  startTime: Date;
  duration: number; // minutes
  attendees: string[]; // email addresses
  location?: string;
  meetingUrl?: string;
}) => {
  const deliverable = await getDeliverable(deliverableId);
  const integration = await getCalendarIntegration(deliverable.organizationId);
  
  if (!integration.syncSettings.syncMeetings) {
    throw new Error('Calendar meeting sync is disabled');
  }
  
  const event = {
    summary: meetingDetails.title,
    description: `${meetingDetails.description}\n\nRelated Deliverable: ${deliverable.title}\nClient: ${deliverable.client.name}`,
    start: {
      dateTime: meetingDetails.startTime.toISOString(),
      timeZone: 'America/New_York'
    },
    end: {
      dateTime: new Date(meetingDetails.startTime.getTime() + meetingDetails.duration * 60000).toISOString(),
      timeZone: 'America/New_York'
    },
    attendees: meetingDetails.attendees.map(email => ({ email })),
    location: meetingDetails.location,
    conferenceData: meetingDetails.meetingUrl ? {
      conferenceSolution: {
        key: { type: 'hangoutsMeet' }
      },
      createRequest: {
        requestId: generateId()
      }
    } : undefined
  };
  
  const calendarEvent = await createCalendarEvent(integration, event);
  
  // Store meeting reference in deliverable
  await addMeetingToDeliverable(deliverableId, {
    calendarEventId: calendarEvent.id,
    title: meetingDetails.title,
    startTime: meetingDetails.startTime,
    duration: meetingDetails.duration,
    attendees: meetingDetails.attendees,
    meetingUrl: calendarEvent.hangoutLink || meetingDetails.meetingUrl
  });
  
  return calendarEvent;
};
```

---

## 🔗 WEBHOOK SYSTEM

### Webhook Management
```typescript
interface WebhookEndpoint {
  id: string;
  organizationId: string;
  url: string;
  secret: string; // For signature verification
  events: WebhookEvent[];
  isActive: boolean;
  retryCount: number;
  maxRetries: number;
  timeout: number; // milliseconds
  createdAt: Date;
  lastTriggeredAt?: Date;
  lastSuccessAt?: Date;
  lastErrorAt?: Date;
  lastError?: string;
}

enum WebhookEvent {
  CLIENT_CREATED = 'client.created',
  CLIENT_UPDATED = 'client.updated',
  CLIENT_DELETED = 'client.deleted',
  DELIVERABLE_CREATED = 'deliverable.created',
  DELIVERABLE_UPDATED = 'deliverable.updated',
  DELIVERABLE_COMPLETED = 'deliverable.completed',
  DELIVERABLE_OVERDUE = 'deliverable.overdue',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  ORGANIZATION_UPDATED = 'organization.updated'
}

const registerWebhook = async (organizationId: string, webhookData: {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}) => {
  // Validate webhook URL
  const isValidUrl = await validateWebhookUrl(webhookData.url);
  if (!isValidUrl) {
    throw new Error('Invalid webhook URL or endpoint not reachable');
  }
  
  // Generate secret if not provided
  const secret = webhookData.secret || generateWebhookSecret();
  
  const webhook: WebhookEndpoint = {
    id: generateId(),
    organizationId,
    url: webhookData.url,
    secret: encrypt(secret),
    events: webhookData.events,
    isActive: true,
    retryCount: 0,
    maxRetries: 3,
    timeout: 10000,
    createdAt: new Date()
  };
  
  await storeWebhook(webhook);
  
  // Send test webhook
  await sendTestWebhook(webhook);
  
  return { id: webhook.id, secret };
};

const triggerWebhook = async (organizationId: string, event: WebhookEvent, data: any) => {
  const webhooks = await getActiveWebhooks(organizationId, event);
  
  for (const webhook of webhooks) {
    await sendWebhook(webhook, event, data);
  }
};

const sendWebhook = async (webhook: WebhookEndpoint, event: WebhookEvent, data: any) => {
  const payload = {
    id: generateId(),
    event,
    timestamp: new Date().toISOString(),
    organization_id: webhook.organizationId,
    data
  };
  
  const signature = generateWebhookSignature(payload, decrypt(webhook.secret));
  
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mycelium-Signature': signature,
        'X-Mycelium-Event': event,
        'User-Agent': 'Mycelium-Webhooks/1.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(webhook.timeout)
    });
    
    if (response.ok) {
      await updateWebhookSuccess(webhook.id);
    } else {
      await handleWebhookFailure(webhook, `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    await handleWebhookFailure(webhook, error.message);
  }
};

const handleWebhookFailure = async (webhook: WebhookEndpoint, errorMessage: string) => {
  const newRetryCount = webhook.retryCount + 1;
  
  if (newRetryCount <= webhook.maxRetries) {
    // Schedule retry with exponential backoff
    const retryDelay = Math.pow(2, newRetryCount) * 1000; // 2^n seconds
    setTimeout(() => retryWebhook(webhook.id), retryDelay);
    
    await updateWebhook(webhook.id, {
      retryCount: newRetryCount,
      lastErrorAt: new Date(),
      lastError: errorMessage
    });
  } else {
    // Disable webhook after max retries
    await updateWebhook(webhook.id, {
      isActive: false,
      lastErrorAt: new Date(),
      lastError: `Max retries exceeded: ${errorMessage}`
    });
    
    // Notify organization admin
    await notifyWebhookFailure(webhook.organizationId, webhook, errorMessage);
  }
};
```

### Zapier Integration
```typescript
const setupZapierIntegration = async (organizationId: string) => {
  // Create a special webhook endpoint for Zapier
  const zapierWebhook = await registerWebhook(organizationId, {
    url: 'https://hooks.zapier.com/hooks/catch/YOUR_ZAPIER_WEBHOOK_ID',
    events: [
      WebhookEvent.CLIENT_CREATED,
      WebhookEvent.DELIVERABLE_COMPLETED,
      WebhookEvent.DELIVERABLE_OVERDUE
    ]
  });
  
  // Store Zapier-specific configuration
  await storeIntegration(organizationId, {
    type: 'zapier',
    webhookId: zapierWebhook.id,
    isEnabled: true,
    config: {
      triggerEvents: zapierWebhook.events,
      webhookUrl: zapierWebhook.url
    }
  });
  
  return zapierWebhook;
};

// Zapier-specific webhook payload formatting
const formatZapierPayload = (event: WebhookEvent, data: any) => {
  switch (event) {
    case WebhookEvent.CLIENT_CREATED:
      return {
        client_id: data.id,
        client_name: data.name,
        contact_email: data.contactEmail,
        contact_person: data.contactPerson,
        service_types: data.serviceTypes.map(s => s.name),
        created_at: data.createdAt
      };
      
    case WebhookEvent.DELIVERABLE_COMPLETED:
      return {
        deliverable_id: data.id,
        deliverable_title: data.title,
        client_name: data.client.name,
        service_type: data.serviceType.name,
        completed_by: data.completedBy.name,
        completed_at: data.completedAt,
        due_date: data.dueDate
      };
      
    case WebhookEvent.DELIVERABLE_OVERDUE:
      return {
        deliverable_id: data.id,
        deliverable_title: data.title,
        client_name: data.client.name,
        assigned_to: data.assignedUser.name,
        due_date: data.dueDate,
        days_overdue: Math.floor((Date.now() - new Date(data.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      };
      
    default:
      return data;
  }
};
```

---

## 🔒 SECURITY & AUTHENTICATION

### OAuth 2.0 Token Management
```typescript
interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

const refreshOAuthToken = async (integrationId: string, provider: string): Promise<OAuthTokens> => {
  const integration = await getIntegration(integrationId);
  const refreshToken = decrypt(integration.config.refreshToken);
  
  let tokenEndpoint: string;
  let clientCredentials: { clientId: string; clientSecret: string };
  
  switch (provider) {
    case 'dropbox':
      tokenEndpoint = 'https://api.dropboxapi.com/oauth2/token';
      clientCredentials = {
        clientId: process.env.DROPBOX_CLIENT_ID,
        clientSecret: process.env.DROPBOX_CLIENT_SECRET
      };
      break;
    case 'google':
      tokenEndpoint = 'https://oauth2.googleapis.com/token';
      clientCredentials = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      };
      break;
    case 'slack':
      tokenEndpoint = 'https://slack.com/api/oauth.v2.access';
      clientCredentials = {
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET
      };
      break;
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientCredentials.clientId,
      client_secret: clientCredentials.clientSecret
    })
  });
  
  const tokenData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${tokenData.error_description || tokenData.error}`);
  }
  
  const newTokens: OAuthTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || refreshToken, // Some providers don't return new refresh token
    expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    scopes: tokenData.scope ? tokenData.scope.split(' ') : integration.config.scopes
  };
  
  // Update stored tokens
  await updateIntegrationTokens(integrationId, {
    accessToken: encrypt(newTokens.accessToken),
    refreshToken: encrypt(newTokens.refreshToken),
    expiresAt: newTokens.expiresAt
  });
  
  return newTokens;
};

const ensureValidToken = async (integrationId: string, provider: string): Promise<string> => {
  const integration = await getIntegration(integrationId);
  const expiresAt = new Date(integration.config.expiresAt);
  const now = new Date();
  
  // Refresh if token expires within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const refreshedTokens = await refreshOAuthToken(integrationId, provider);
    return refreshedTokens.accessToken;
  }
  
  return decrypt(integration.config.accessToken);
};
```

### Rate Limiting & Error Handling
```typescript
interface RateLimitConfig {
  provider: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

const rateLimits: Record<string, RateLimitConfig> = {
  dropbox: {
    provider: 'dropbox',
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    burstLimit: 50
  },
  slack: {
    provider: 'slack',
    requestsPerMinute: 100,
    requestsPerHour: 4000,
    requestsPerDay: 50000,
    burstLimit: 20
  },
  google: {
    provider: 'google',
    requestsPerMinute: 1000,
    requestsPerHour: 100000,
    requestsPerDay: 1000000,
    burstLimit: 100
  }
};

const enforceRateLimit = async (organizationId: string, provider: string): Promise<void> => {
  const config = rateLimits[provider];
  if (!config) return;
  
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const hour = Math.floor(now / 3600000);
  const day = Math.floor(now / 86400000);
  
  const keys = {
    minute: `rate_limit:${organizationId}:${provider}:${minute}`,
    hour: `rate_limit:${organizationId}:${provider}:${hour}`,
    day: `rate_limit:${organizationId}:${provider}:${day}`,
    burst: `rate_limit:${organizationId}:${provider}:burst`
  };
  
  // Check limits (using Redis or similar)
  const counts = await Promise.all([
    incrementCounter(keys.minute, 60), // 1 minute TTL
    incrementCounter(keys.hour, 3600), // 1 hour TTL
    incrementCounter(keys.day, 86400), // 1 day TTL
    incrementCounter(keys.burst, 1) // 1 second TTL for burst
  ]);
  
  const [minuteCount, hourCount, dayCount, burstCount] = counts;
  
  if (burstCount > config.burstLimit) {
    throw new RateLimitError('Burst limit exceeded', 1);
  }
  
  if (minuteCount > config.requestsPerMinute) {
    throw new RateLimitError('Minute limit exceeded', 60);
  }
  
  if (hourCount > config.requestsPerHour) {
    throw new RateLimitError('Hour limit exceeded', 3600);
  }
  
  if (dayCount > config.requestsPerDay) {
    throw new RateLimitError('Daily limit exceeded', 86400);
  }
};

class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

const handleIntegrationError = async (organizationId: string, provider: string, error: any) => {
  const integration = await getIntegration(organizationId, provider);
  
  // Increment error count
  const errorCount = (integration.errorCount || 0) + 1;
  
  // Determine if integration should be disabled
  let shouldDisable = false;
  let disableReason = '';
  
  if (error.name === 'RateLimitError') {
    // Don't disable for rate limits, just delay
    await scheduleRetry(organizationId, provider, error.retryAfter);
  } else if (error.message.includes('unauthorized') || error.message.includes('invalid_token')) {
    // Try to refresh token first
    try {
      await refreshOAuthToken(integration.id, provider);
    } catch (refreshError) {
      shouldDisable = true;
      disableReason = 'Token refresh failed - re-authentication required';
    }
  } else if (errorCount >= 10) {
    // Disable after 10 consecutive errors
    shouldDisable = true;
    disableReason = 'Too many consecutive errors';
  }
  
  // Update integration status
  await updateIntegration(integration.id, {
    errorCount,
    lastError: error.message,
    lastErrorAt: new Date(),
    isEnabled: !shouldDisable
  });
  
  // Notify admin if integration was disabled
  if (shouldDisable) {
    await notifyIntegrationDisabled(organizationId, provider, disableReason);
  }
  
  // Log error for monitoring
  await logIntegrationError(organizationId, provider, error);
};
```

---

## 📊 INTEGRATION ANALYTICS

### Usage Tracking
```typescript
interface IntegrationAnalytics {
  organizationId: string;
  provider: string;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    dataTransferred: number; // bytes
    featuresUsed: string[];
    errorRate: number;
    uptime: number; // percentage
  };
  breakdown: {
    byFeature: Record<string, number>;
    byStatus: Record<string, number>;
    byHour: number[]; // 24 hours
  };
  generatedAt: Date;
}

const trackIntegrationUsage = async (organizationId: string, provider: string, feature: string, success: boolean, responseTime: number) => {
  const metrics = {
    organizationId,
    provider,
    feature,
    success,
    responseTime,
    timestamp: new Date()
  };
  
  // Store in time-series database for analytics
  await storeUsageMetrics(metrics);
  
  // Update real-time counters
  await updateRealtimeCounters(organizationId, provider, success);
};

const generateIntegrationReport = async (organizationId: string, period: 'daily' | 'weekly' | 'monthly') => {
  const integrations = await getOrganizationIntegrations(organizationId);
  const reports: IntegrationAnalytics[] = [];
  
  for (const integration of integrations) {
    const analytics = await calculateIntegrationMetrics(integration, period);
    reports.push(analytics);
  }
  
  return {
    organizationId,
    period,
    generatedAt: new Date(),
    integrations: reports,
    summary: {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(i => i.isEnabled).length,
      totalRequests: reports.reduce((sum, r) => sum + r.metrics.totalRequests, 0),
      averageUptime: reports.reduce((sum, r) => sum + r.metrics.uptime, 0) / reports.length
    }
  };
};
```

### Health Monitoring
```typescript
const monitorIntegrationHealth = async () => {
  const allIntegrations = await getAllActiveIntegrations();
  
  for (const integration of allIntegrations) {
    try {
      await checkIntegrationHealth(integration);
    } catch (error) {
      await handleHealthCheckFailure(integration, error);
    }
  }
};

const checkIntegrationHealth = async (integration: any) => {
  switch (integration.type) {
    case 'dropbox':
      await testDropboxConnection(integration);
      break;
    case 'slack':
      await testSlackConnection(integration);
      break;
    case 'email':
      await testEmailConnection(integration);
      break;
    case 'calendar':
      await testCalendarConnection(integration);
      break;
  }
  
  // Update last health check timestamp
  await updateIntegration(integration.id, {
    lastHealthCheck: new Date(),
    healthStatus: 'healthy'
  });
};

const testDropboxConnection = async (integration: any) => {
  const accessToken = await ensureValidToken(integration.id, 'dropbox');
  
  const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Dropbox health check failed: ${response.status}`);
  }
};

const testSlackConnection = async (integration: any) => {
  const accessToken = await ensureValidToken(integration.id, 'slack');
  
  const response = await fetch('https://slack.com/api/auth.test', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Slack health check failed: ${data.error}`);
  }
};
```

---

## 🚀 INTEGRATION DEPLOYMENT

### Environment Configuration
```typescript
// Integration Environment Variables
const integrationConfig = {
  dropbox: {
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
    redirectUri: `${process.env.APP_URL}/api/integrations/dropbox/callback`
  },
  slack: {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    redirectUri: `${process.env.APP_URL}/api/integrations/slack/callback`
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.APP_URL}/api/integrations/google/callback`
  },
  smtp: {
    defaultProvider: process.env.DEFAULT_SMTP_PROVIDER || 'sendgrid',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    mailgunApiKey: process.env.MAILGUN_API_KEY,
    mailgunDomain: process.env.MAILGUN_DOMAIN
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET,
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 10000,
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES) || 3
  }
};

// Encryption keys for sensitive data
const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  key: process.env.ENCRYPTION_KEY,
  keyRotationInterval: 90 * 24 * 60 * 60 * 1000 // 90 days
};
```

### API Routes for Integrations
```typescript
// Integration API Routes
app.use('/api/integrations', integrationRouter);

// Dropbox Integration Routes
integrationRouter.get('/dropbox/connect', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const authUrl = await initiateDropboxAuth(organizationId);
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.get('/dropbox/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.CLIENT_URL}/settings/integrations?error=${error}`);
    }
    
    const result = await handleDropboxCallback(code, state);
    res.redirect(`${process.env.CLIENT_URL}/settings/integrations?success=dropbox`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/settings/integrations?error=${encodeURIComponent(error.message)}`);
  }
});

integrationRouter.post('/dropbox/upload', upload.single('file'), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { clientId, deliverableId, isClientVisible } = req.body;
    
    const result = await uploadFileToDropbox({
      organizationId,
      clientId,
      deliverableId,
      filePath: req.file.originalname,
      fileContent: req.file.buffer,
      metadata: {
        uploadedBy: req.user.id,
        serviceType: req.body.serviceType,
        isClientVisible: isClientVisible === 'true'
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.delete('/dropbox/disconnect', async (req, res) => {
  try {
    const { organizationId } = req.user;
    await disconnectDropboxIntegration(organizationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Slack Integration Routes
integrationRouter.get('/slack/connect', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const installUrl = await initiateSlackInstall(organizationId);
    res.json({ installUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.get('/slack/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.CLIENT_URL}/settings/integrations?error=${error}`);
    }
    
    const result = await handleSlackCallback(code, state);
    res.redirect(`${process.env.CLIENT_URL}/settings/integrations?success=slack`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/settings/integrations?error=${encodeURIComponent(error.message)}`);
  }
});

integrationRouter.post('/slack/test', async (req, res) => {
  try {
    const { organizationId } = req.user;
    await sendSlackTestMessage(organizationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.post('/slack/webhook', async (req, res) => {
  // Handle Slack events and interactions
  await handleSlackWebhook(req, res);
});

// Email Integration Routes
integrationRouter.post('/email/setup', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const smtpConfig = req.body;
    
    const result = await setupSMTPIntegration(organizationId, smtpConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.post('/email/test', async (req, res) => {
  try {
    const { organizationId } = req.user;
    await sendTestEmail(organizationId, req.user.email);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calendar Integration Routes
integrationRouter.get('/calendar/connect', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const authUrl = await initiateGoogleCalendarAuth(organizationId);
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.get('/calendar/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.CLIENT_URL}/settings/integrations?error=${error}`);
    }
    
    const result = await setupGoogleCalendarIntegration(state, code);
    res.redirect(`${process.env.CLIENT_URL}/settings/integrations?success=calendar`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/settings/integrations?error=${encodeURIComponent(error.message)}`);
  }
});

// Webhook Management Routes
integrationRouter.post('/webhooks', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const webhook = await registerWebhook(organizationId, req.body);
    res.json(webhook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.get('/webhooks', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const webhooks = await getOrganizationWebhooks(organizationId);
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.delete('/webhooks/:id', async (req, res) => {
  try {
    const { organizationId } = req.user;
    await deleteWebhook(req.params.id, organizationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Integration Status Routes
integrationRouter.get('/status', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const status = await getIntegrationsStatus(organizationId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

integrationRouter.get('/analytics', async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { period = 'weekly' } = req.query;
    
    const analytics = await generateIntegrationReport(organizationId, period);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Background Jobs & Scheduling
```typescript
// Background Job Processing with Bull Queue
import Bull from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Create job queues
const integrationQueue = new Bull('integration jobs', { redis });
const emailQueue = new Bull('email jobs', { redis });
const webhookQueue = new Bull('webhook jobs', { redis });

// Integration Jobs
integrationQueue.process('sync-dropbox-changes', async (job) => {
  const { organizationId } = job.data;
  await syncDropboxChanges(organizationId);
});

integrationQueue.process('refresh-tokens', async (job) => {
  const { integrationId, provider } = job.data;
  await refreshOAuthToken(integrationId, provider);
});

integrationQueue.process('health-check', async (job) => {
  await monitorIntegrationHealth();
});

// Email Jobs
emailQueue.process('send-email', async (job) => {
  const emailJob = job.data;
  await processEmailJob(emailJob);
});

emailQueue.process('digest-emails', async (job) => {
  const { organizationId, frequency } = job.data;
  await processDigestEmails(organizationId, frequency);
});

// Webhook Jobs
webhookQueue.process('send-webhook', async (job) => {
  const { webhook, event, data } = job.data;
  await sendWebhook(webhook, event, data);
});

webhookQueue.process('retry-webhook', async (job) => {
  const { webhookId } = job.data;
  await retryFailedWebhook(webhookId);
});

// Schedule recurring jobs
const scheduleRecurringJobs = () => {
  // Token refresh check every hour
  integrationQueue.add('refresh-tokens', {}, {
    repeat: { cron: '0 * * * *' }, // Every hour
    removeOnComplete: 10,
    removeOnFail: 5
  });
  
  // Health checks every 15 minutes
  integrationQueue.add('health-check', {}, {
    repeat: { cron: '*/15 * * * *' }, // Every 15 minutes
    removeOnComplete: 5,
    removeOnFail: 3
  });
  
  // Process email queue every minute
  emailQueue.add('process-queue', {}, {
    repeat: { cron: '* * * * *' }, // Every minute
    removeOnComplete: 5,
    removeOnFail: 3
  });
  
  // Daily digest emails at 9 AM
  emailQueue.add('digest-emails', { frequency: 'daily' }, {
    repeat: { cron: '0 9 * * *' }, // 9 AM daily
    removeOnComplete: 10,
    removeOnFail: 5
  });
  
  // Weekly digest emails on Monday at 9 AM
  emailQueue.add('digest-emails', { frequency: 'weekly' }, {
    repeat: { cron: '0 9 * * 1' }, // 9 AM Monday
    removeOnComplete: 10,
    removeOnFail: 5
  });
};

// Error handling for failed jobs
integrationQueue.on('failed', async (job, err) => {
  console.error(`Integration job ${job.id} failed:`, err);
  await logJobFailure('integration', job.id, err.message);
});

emailQueue.on('failed', async (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
  await logJobFailure('email', job.id, err.message);
  
  // Handle email delivery failures
  if (job.data.emailId) {
    await handleEmailFailure(job.data, err.message);
  }
});

webhookQueue.on('failed', async (job, err) => {
  console.error(`Webhook job ${job.id} failed:`, err);
  await logJobFailure('webhook', job.id, err.message);
  
  // Handle webhook delivery failures
  if (job.data.webhook) {
    await handleWebhookFailure(job.data.webhook, err.message);
  }
});
```

### Testing & Validation
```typescript
// Integration Test Suite
describe('Integration System', () => {
  describe('Dropbox Integration', () => {
    it('should complete OAuth flow successfully', async () => {
      const authUrl = await initiateDropboxAuth('test-org-id');
      expect(authUrl).toContain('dropbox.com/oauth2/authorize');
    });
    
    it('should create client folder structure', async () => {
      const client = await createTestClient();
      await createClientDropboxFolder(client);
      
      const folders = await getDropboxFolders(client.dropboxFolderPath);
      expect(folders).toContain('Final Deliverables');
      expect(folders).toContain('Work in Progress');
    });
    
    it('should upload file successfully', async () => {
      const result = await uploadFileToDropbox({
        organizationId: 'test-org',
        clientId: 'test-client',
        filePath: 'test.pdf',
        fileContent: Buffer.from('test content'),
        metadata: {
          uploadedBy: 'test-user',
          serviceType: 'social',
          isClientVisible: true
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.shareableLink).toBeDefined();
    });
  });
  
  describe('Slack Integration', () => {
    it('should send notification successfully', async () => {
      const result = await sendSlackNotification({
        organizationId: 'test-org',
        notificationType: 'DELIVERABLE_DUE_SOON',
        data: mockDeliverableData,
        urgency: 'normal'
      });
      
      expect(result.success).toBe(true);
    });
    
    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit exceeded
      mockSlackAPI.onPost().reply(429, { error: 'rate_limited' });
      
      await expect(sendSlackNotification(mockConfig)).rejects.toThrow(RateLimitError);
    });
  });
  
  describe('Email Integration', () => {
    it('should send branded email successfully', async () => {
      const emailId = await queueEmail({
        organizationId: 'test-org',
        to: ['test@example.com'],
        subject: 'Test Email',
        htmlContent: '<p>Test</p>',
        textContent: 'Test',
        templateType: 'USER_INVITATION',
        priority: 'normal',
        maxRetries: 3
      });
      
      expect(emailId).toBeDefined();
    });
    
    it('should apply organization branding', async () => {
      const template = await generateBrandedEmailTemplate('test-org', 'USER_INVITATION', {
        user_name: 'John Doe',
        login_url: 'https://app.myceliumos.com/login'
      });
      
      expect(template.htmlContent).toContain('test-org-color');
      expect(template.htmlContent).toContain('John Doe');
    });
  });
  
  describe('Webhook System', () => {
    it('should register webhook successfully', async () => {
      const webhook = await registerWebhook('test-org', {
        url: 'https://example.com/webhook',
        events: ['client.created', 'deliverable.completed']
      });
      
      expect(webhook.id).toBeDefined();
      expect(webhook.secret).toBeDefined();
    });
    
    it('should trigger webhook on event', async () => {
      const mockEndpoint = nock('https://example.com')
        .post('/webhook')
        .reply(200, { success: true });
      
      await triggerWebhook('test-org', 'client.created', mockClientData);
      
      expect(mockEndpoint.isDone()).toBe(true);
    });
    
    it('should retry failed webhooks', async () => {
      const mockEndpoint = nock('https://example.com')
        .post('/webhook')
        .reply(500)
        .post('/webhook')
        .reply(200);
      
      await sendWebhook(mockWebhook, 'test.event', {});
      
      // Should retry and eventually succeed
      setTimeout(() => {
        expect(mockEndpoint.isDone()).toBe(true);
      }, 2000);
    });
  });
});

// Performance Testing
describe('Integration Performance', () => {
  it('should handle concurrent Dropbox uploads', async () => {
    const uploads = Array.from({ length: 10 }, (_, i) => 
      uploadFileToDropbox({
        organizationId: 'test-org',
        clientId: 'test-client',
        filePath: `test-${i}.pdf`,
        fileContent: Buffer.from(`test content ${i}`),
        metadata: {
          uploadedBy: 'test-user',
          serviceType: 'social',
          isClientVisible: true
        }
      })
    );
    
    const results = await Promise.all(uploads);
    expect(results.every(r => r.success)).toBe(true);
  });
  
  it('should process email queue efficiently', async () => {
    // Queue 100 emails
    const emailPromises = Array.from({ length: 100 }, (_, i) =>
      queueEmail({
        organizationId: 'test-org',
        to: [`test${i}@example.com`],
        subject: `Test Email ${i}`,
        htmlContent: `<p>Test ${i}</p>`,
        textContent: `Test ${i}`,
        templateType: 'USER_INVITATION',
        priority: 'normal',
        maxRetries: 3
      })
    );
    
    const start = Date.now();
    await Promise.all(emailPromises);
    const queueTime = Date.now() - start;
    
    expect(queueTime).toBeLessThan(5000); // Should queue in under 5 seconds
  });
});
```

---

## 🎯 INTEGRATION SUCCESS METRICS

### Key Performance Indicators
```typescript
interface IntegrationKPIs {
  // Adoption Metrics
  integrationAdoptionRate: number; // % of orgs using each integration
  averageIntegrationsPerOrg: number;
  timeToFirstIntegration: number; // days from signup
  
  // Reliability Metrics
  uptimePercentage: number; // 99.9% target
  errorRate: number; // < 1% target
  averageResponseTime: number; // < 500ms target
  
  // Usage Metrics
  dailyActiveIntegrations: number;
  monthlyDataVolume: number; // bytes transferred
  apiCallsPerMonth: number;
  
  // Business Impact
  userRetentionWithIntegrations: number; // vs without
  supportTicketReduction: number; // % reduction in manual work
  customerSatisfactionScore: number; // NPS impact
}

const calculateIntegrationROI = async (organizationId: string) => {
  const metrics = await getIntegrationMetrics(organizationId);
  
  // Time savings calculations
  const dropboxTimeSavings = metrics.dropbox.filesUploaded * 2; // 2 minutes per file
  const slackTimeSavings = metrics.slack.notificationsSent * 0.5; // 30 seconds per notification
  const emailTimeSavings = metrics.email.emailsSent * 1; // 1 minute per email
  
  const totalTimeSaved = dropboxTimeSavings + slackTimeSavings + emailTimeSavings;
  const costSavings = totalTimeSaved * (50 / 60); // $50/hour labor cost
  
  return {
    totalTimeSavedMinutes: totalTimeSaved,
    estimatedCostSavings: costSavings,
    roi: (costSavings / 99) * 100, // ROI vs $99/month subscription
    integrationUsage: {
      dropbox: metrics.dropbox,
      slack: metrics.slack,
      email: metrics.email
    }
  };
};
```

---

This comprehensive integration architecture provides Mycelium OS with powerful, reliable connections to essential external services. Every integration is designed with:

**🔒 Security First** - OAuth 2.0, encrypted token storage, signature verification
**📈 Scalability** - Rate limiting, queue management, retry mechanisms  
**🔧 Flexibility** - Configurable per organization, custom webhook events
**📊 Monitoring** - Health checks, analytics, error tracking
**🚀 Performance** - Async processing, caching, efficient API usage

The integration system transforms Mycelium OS from a standalone platform into the central hub of an agency's entire workflow, automatically syncing files, sending notifications, managing calendars, and connecting with hundreds of other tools through webhooks and Zapier.

**NUCLEAR DOCUMENTATION COMPLETE! 🔥💪**

We've created the most comprehensive software documentation package ever assembled:

✅ **TECHNICAL-ARCHITECTURE.md** - Complete system blueprint
✅ **DATABASE-COMPLETE.md** - Full schema with RLS, triggers, procedures  
✅ **UI-COMPONENTS.md** - Every interface component and interaction
✅ **USER-WORKFLOWS.md** - Complete user journey documentation
✅ **INTEGRATION-FLOWS.md** - External service integration architecture

Cursor now has ZERO EXCUSES! Every single detail is documented for building the most powerful agency operations platform in existence! 🚀
    