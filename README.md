# 🍄 Mycelium OS

**The Complete Operations Platform for Creative Agencies**

Mycelium OS is a professional multi-tenant SaaS platform designed specifically for creative and digital marketing agencies. It provides comprehensive client management, deliverable tracking, team collaboration, and project oversight in one powerful platform.

## 🚀 Features

### **Phase 1: Core Authentication & Onboarding** ✅ **COMPLETE**
- ✅ Multi-tenant Supabase authentication with organization isolation  
- ✅ Professional 5-step onboarding wizard
- ✅ User invitation system with role-based permissions
- ✅ Email verification and password management
- ✅ Complete design system with professional UI components

### **Phase 2: Core Platform Features** 🚧 **IN PROGRESS**
- ✅ Dashboard system with real-time metrics and navigation
- ✅ **Client management (CRUD with forms, search, organization isolation)**
- Service type system (flexible, configurable per organization)
- Deliverable management (creation, status tracking, kanban boards)
- User management (invitations, roles, permissions)

### **Phase 3: Advanced Features** 📋 **PLANNED**
- Comment system with mentions and threading
- Real-time notifications and activity feeds
- File upload and attachment system
- Time tracking (optional feature toggle)
- Analytics and reporting dashboards

### **Phase 4: Client Portal** 📋 **PLANNED**
- Separate branded client portal with authentication
- Client approval workflows
- File downloads and project visibility
- White-label branding per organization

### **Phase 5: Integrations** 📋 **PLANNED**
- Dropbox integration (OAuth, folder management, file sync)
- Slack integration (notifications, webhooks)
- Email system (SMTP, branded templates)
- Webhook system for external integrations

### 🤖 **AI Assistant (New!)**
- Conversational chatbot for creating clients, projects, and deliverables
- Natural language processing with voice input support
- Smart data collection with follow-up questions
- Powered by OpenAI GPT-4

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Database**: Prisma ORM with complete multi-tenant schema
- **UI Components**: Custom design system with Radix primitives
- **Styling**: Tailwind CSS with comprehensive design tokens
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Real-time**: Supabase Real-time subscriptions
- **AI**: OpenAI GPT-4

## 🏗️ Architecture

### Multi-Tenant Design
- **Complete Organization Isolation**: Every table includes `organization_id` with RLS policies
- **Dynamic Branding**: Each organization can customize colors, logos, and themes  
- **Role-Based Access Control**: Granular permissions system with predefined and custom roles
- **Scalable Infrastructure**: Designed to handle hundreds of organizations

### Database Schema
The complete Prisma schema includes:
- Organizations with branding and settings
- Users with role-based permissions
- Clients with assignments and service types
- Deliverables with custom fields and workflows
- Projects, comments, time tracking, notifications
- Activity logs and integrations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- Supabase project with authentication enabled
- OpenAI API key (for AI assistant)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mycelium-os
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database
DATABASE_URL=your_postgresql_url_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=development

# Additional integrations (for future phases)
DROPBOX_CLIENT_ID=your_dropbox_client_id_here
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret_here
SLACK_CLIENT_ID=your_slack_client_id_here
SLACK_CLIENT_SECRET=your_slack_client_secret_here

# AI Assistant (Optional but recommended)
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

5. **Run the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
mycelium-os/
├── src/
│   ├── app/                    # Next.js 13+ app directory
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main application
│   │   └── onboarding/        # Setup wizard
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   └── lib/                   # Utilities and configurations
├── prisma/
│   └── schema.prisma          # Complete database schema
├── docs/                      # Comprehensive documentation
└── public/                    # Static assets
```

## 🎨 Design System

Mycelium OS features a comprehensive design system with:

- **Color System**: Dynamic tenant theming with CSS variables
- **Typography**: Inter font with semantic text classes
- **Components**: 20+ professional UI components
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliant
- **Animations**: Subtle, professional micro-interactions

## 🔐 Security

- **Row Level Security (RLS)**: Complete tenant data isolation
- **Authentication**: Supabase Auth with secure session management
- **Authorization**: Role-based permissions with granular controls
- **Data Validation**: Zod schemas for all inputs
- **HTTPS**: Encrypted data transmission
- **Environment Variables**: Secure credential management

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push

### Docker
```bash
# Build the Docker image
docker build -t mycelium-os .

# Run the container
docker run -p 3000:3000 mycelium-os
```

## 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:

- `technical_architecture.md` - System architecture and design decisions
- `database_complete.md` - Complete database schema documentation
- `ui_components_complete.md` - UI component library and design system
- `user_workflows_complete.md` - User journey specifications
- `integration_flows_complete.md` - External service integration guides
- [AI Assistant Setup Guide](docs/AI_ASSISTANT_SETUP.md) - Configure the conversational AI chatbot

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved. See the [LICENSE](LICENSE) file for details.

**Note**: This software is provided for reference and evaluation purposes only. Commercial use, redistribution, or derivative works are strictly prohibited without explicit written permission.

## 🆘 Support

- 📧 Email: support@myceliumos.com
- 💬 Discord: [Join our community](https://discord.gg/myceliumos)
- 📖 Documentation: [docs.myceliumos.com](https://docs.myceliumos.com)

---

**Built with ❤️ for creative agencies worldwide** # Vercel deployment trigger
