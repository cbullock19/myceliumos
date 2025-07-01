# UI COMPONENTS & INTERFACE DESIGN - MYCELIUM OS
## Complete User Interface Specification for Multi-Tenant Agency Platform

---

## 🎨 DESIGN SYSTEM FOUNDATION

### Core Design Principles
- **Professional & Modern**: HubSpot-inspired interface that commands respect
- **Multi-Tenant Theming**: Dynamic color schemes per organization
- **Mobile-First**: Responsive design that works on all devices
- **Accessibility**: WCAG 2.1 AA compliant with proper contrast and focus states
- **Performance**: Optimized animations and efficient rendering

### Color System & Dynamic Theming
```css
:root {
  /* Mycelium OS Brand Colors */
  --color-primary: #228B22;        /* Forest Green */
  --color-primary-hover: #1e7a1e;
  --color-primary-light: #4da64d;
  
  /* Dynamic Tenant Colors (Injected via JS) */
  --color-brand: var(--color-primary);     /* Overridden per tenant */
  --color-brand-hover: var(--color-primary-hover);
  
  /* Status Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Neutral Palette */
  --gray-50: #f8fafc;
  --gray-900: #0f172a;
  
  /* Semantic Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-color: #e2e8f0;
}

/* Tenant Theme Injection */
[data-tenant-theme="isemedia"] {
  --color-brand: #f24913;
  --color-brand-hover: #d63e0e;
}
```

### Typography System
```css
/* Inter Font Family */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.text-display {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.text-heading {
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 1.3;
}

.text-body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}
```

---

## 🏗️ APPLICATION LAYOUT

### Main App Shell
```tsx
// Layout Structure
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNavigation />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global Components */}
      <CommandPalette />
      <NotificationCenter />
      <ModalContainer />
    </div>
  );
};
```

### Top Navigation Bar
```tsx
const TopNavigation = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Logo & Org Name */}
        <div className="flex items-center space-x-3">
          <OrganizationLogo />
          <span className="font-semibold text-gray-900">
            {organization.name}
          </span>
        </div>
        
        {/* Center: Search */}
        <SearchCommand />
        
        {/* Right: User Menu */}
        <div className="flex items-center space-x-3">
          <NotificationButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
```

### Sidebar Navigation
```tsx
const Sidebar = () => {
  const navigationItems = [
    {
      section: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: HomeIcon, badge: pendingCount }
      ]
    },
    {
      section: "Work",
      items: [
        { label: "Clients", href: "/clients", icon: UsersIcon },
        { label: "Deliverables", href: "/deliverables", icon: CheckSquareIcon },
        { label: "Projects", href: "/projects", icon: FolderIcon }
      ]
    },
    {
      section: "Admin",
      items: [
        { label: "Team", href: "/team", icon: TeamIcon, adminOnly: true },
        { label: "Analytics", href: "/analytics", icon: ChartIcon, adminOnly: true }
      ]
    }
  ];
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-6">
        {navigationItems.map(section => (
          <NavigationSection key={section.section} {...section} />
        ))}
      </nav>
    </aside>
  );
};
```

---

## 📱 CORE UI COMPONENTS

### Button System
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Button = ({ variant = 'primary', size = 'md', loading, children, ...props }) => {
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-hover shadow-sm',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300',
    ghost: 'text-gray-700 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 focus:outline-none focus:ring-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
      `}
      disabled={loading}
      {...props}
    >
      {loading && <LoadingSpinner className="w-4 h-4 mr-2" />}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
```

### Form Components
```tsx
const Input = ({ label, error, hint, leftIcon, rightIcon, ...props }) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            {leftIcon}
          </div>
        )}
        
        <input
          className={`
            block w-full px-3 py-2 border rounded-lg
            text-gray-900 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent
            ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
  );
};
```

### Card Components
```tsx
const Card = ({ children, hover = false, clickable = false, padding = 'md', ...props }) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 transition-all duration-200
        ${hover || clickable ? 'hover:shadow-md hover:border-gray-300' : ''}
        ${clickable ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${paddingClasses[padding]}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const StatsCard = ({ title, value, change, trend, icon: Icon, color = 'brand' }) => {
  const colorClasses = {
    brand: 'text-brand bg-brand/10',
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50'
  };
  
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};
```

---

## 📊 DASHBOARD INTERFACE

### Main Dashboard
```tsx
const DashboardPage = ({ user, organization }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good morning, {user.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your work today.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="secondary" leftIcon={<CalendarIcon />}>
            Schedule
          </Button>
          <Button variant="primary" leftIcon={<PlusIcon />}>
            New Deliverable
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Due Today"
          value="8"
          change="+2 from yesterday"
          trend="up"
          icon={ClockIcon}
          color="warning"
        />
        <StatsCard
          title="In Progress"
          value="12"
          change="+5 this week"
          trend="up"
          icon={PlayIcon}
          color="brand"
        />
        <StatsCard
          title="Completed"
          value="47"
          change="+12 this week"
          trend="up"
          icon={CheckCircleIcon}
          color="success"
        />
        <StatsCard
          title="Overdue"
          value="3"
          change="Needs attention"
          trend="down"
          icon={AlertTriangleIcon}
          color="error"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <TasksToday />
          <UpcomingDeadlines />
        </div>
        
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
          <TeamOverview />
        </div>
      </div>
    </div>
  );
};
```

### Tasks Today Component
```tsx
const TasksToday = () => {
  const [filter, setFilter] = useState('all');
  const { data: tasks } = useTodayTasks();
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tasks Due Today</h3>
          <p className="text-sm text-gray-600">{tasks?.length} tasks need your attention</p>
        </div>
        
        <div className="flex space-x-2">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterButton>
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
            Pending
          </FilterButton>
          <FilterButton active={filter === 'progress'} onClick={() => setFilter('progress')}>
            In Progress
          </FilterButton>
        </div>
      </div>
      
      <div className="space-y-3">
        {tasks?.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </Card>
  );
};

const TaskCard = ({ task }) => {
  return (
    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <button className="w-5 h-5 rounded border-2 border-gray-300 hover:border-brand flex items-center justify-center">
        {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        
        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
          <span className="flex items-center">
            <UserIcon className="w-4 h-4 mr-1" />
            {task.client.name}
          </span>
          <span className="flex items-center">
            <TagIcon className="w-4 h-4 mr-1" />
            {task.serviceType}
          </span>
          <span className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-1" />
            {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm">View</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVerticalIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Reassign</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
```

---

## 👥 CLIENT MANAGEMENT INTERFACE

### Client List View
```tsx
const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client relationships and projects</p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="secondary" leftIcon={<UploadIcon />}>Import CSV</Button>
          <Button variant="primary" leftIcon={<PlusIcon />}>Add Client</Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SearchInput
            placeholder="Search clients..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          <ServiceTypeFilter />
        </div>
        
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>
      
      {/* Client Grid/List */}
      {viewMode === 'grid' ? <ClientGrid /> : <ClientTable />}
    </div>
  );
};
```

### Client Card Component
```tsx
const ClientCard = ({ client }) => {
  return (
    <Card hover clickable className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <ClientAvatar client={client} />
          <div>
            <h3 className="font-semibold text-gray-900">{client.name}</h3>
            <p className="text-sm text-gray-600">{client.contactPerson}</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVerticalIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit Client</DropdownMenuItem>
            <DropdownMenuItem>View Projects</DropdownMenuItem>
            <DropdownMenuItem className="text-yellow-600">Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Service Types */}
      <div className="flex flex-wrap gap-2 mb-4">
        {client.serviceTypes.map(type => (
          <ServiceTypeBadge key={type} serviceType={type} />
        ))}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{client.stats.totalDeliverables}</p>
          <p className="text-xs text-gray-600">Total Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{client.stats.completedDeliverables}</p>
          <p className="text-xs text-gray-600">Completed</p>
        </div>
      </div>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <StatusBadge status={client.status} />
          <span className="text-sm text-gray-600">
            {Math.round((client.stats.completedDeliverables / client.stats.totalDeliverables) * 100)}% complete
          </span>
        </div>
        <ProgressBar 
          value={client.stats.completedDeliverables} 
          max={client.stats.totalDeliverables}
        />
      </div>
      
      {/* Next Deadline */}
      {client.nextDeadline && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Next Deadline</span>
            <span className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(client.nextDeadline), { addSuffix: true })}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
```

---

## 📋 DELIVERABLE MANAGEMENT INTERFACE

### Deliverable Kanban View
```tsx
const DeliverableKanbanView = ({ deliverables }) => {
  const columns = [
    { id: 'pending', title: 'Pending', status: 'PENDING' },
    { id: 'in_progress', title: 'In Progress', status: 'IN_PROGRESS' },
    { id: 'review', title: 'Needs Review', status: 'NEEDS_REVIEW' },
    { id: 'completed', title: 'Completed', status: 'COMPLETED' }
  ];
  
  return (
    <div className="flex space-x-6 overflow-x-auto pb-4">
      {columns.map(column => (
        <KanbanColumn key={column.id} {...column} deliverables={deliverables} />
      ))}
    </div>
  );
};

const KanbanColumn = ({ title, status, deliverables }) => {
  const columnDeliverables = deliverables?.filter(d => d.status === status) || [];
  
  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge variant="secondary">{columnDeliverables.length}</Badge>
        </div>
        
        <div className="space-y-3">
          {columnDeliverables.map(deliverable => (
            <DeliverableKanbanCard key={deliverable.id} deliverable={deliverable} />
          ))}
        </div>
        
        <button className="w-full mt-3 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand hover:text-brand transition-colors">
          + Add deliverable
        </button>
      </div>
    </div>
  );
};
```

---

## 🔔 NOTIFICATION & FEEDBACK SYSTEM

### Toast Notifications
```tsx
const Toast = ({ message, type, onClose }) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: AlertTriangleIcon,
    info: InfoIcon
  };
  
  const Icon = icons[type];
  
  return (
    <div className={`
      p-4 rounded-lg border shadow-lg animate-slide-up
      ${typeStyles[type]}
    `}>
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-auto">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
```

### Loading States
```tsx
const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-brand ${sizes[size]}`} />
  );
};

const SkeletonLoader = ({ lines = 3 }) => {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" />
      ))}
    </div>
  );
};
```

---

## 📱 RESPONSIVE DESIGN BREAKPOINTS

### Mobile Adaptations
```css
/* Mobile Navigation */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    position: fixed;
    z-index: 50;
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  /* Mobile-first grid adjustments */
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .client-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet adaptations */
@media (min-width: 768px) and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .client-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .client-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 🎭 ANIMATION SPECIFICATIONS

### Micro-Interactions
```css
/* Button hover effects */
.btn-primary {
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Card hover effects */
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s ease;
}

/* Modal animations */
.modal-backdrop {
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

.modal-content {
  animation: scaleIn 0.2s ease;
}
```

---

This UI specification provides a complete blueprint for building a professional, modern agency operations platform that rivals the best SaaS tools in the market. Every component is designed to be accessible, responsive, and delightful to use while maintaining the flexibility needed for multi-tenant operation.