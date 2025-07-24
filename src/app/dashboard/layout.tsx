'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { createSupabaseClient } from '@/lib/supabase'
import AIChat from '@/components/ui/ai-chat'
import { 
  Home, 
  Users, 
  CheckSquare, 
  FolderOpen, 
  BarChart3, 
  Settings,
  Bell,
  Search,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface UserData {
  id: string
  email: string
  name: string
  organization: {
    name: string
    slug: string
  }
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createSupabaseClient()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/auth/signin')
          return
        }

        // Fetch organization data from API to get the real organization name
        let organizationName = user.user_metadata?.companyName || user.user_metadata?.organizationName || 'Your Organization'
        let organizationSlug = user.user_metadata?.organizationSlug || 'your-organization'
        
        try {
          const response = await fetch('/api/auth/check-onboarding')
          if (response.ok) {
            const data = await response.json()
            if (data.data?.organization?.name) {
              organizationName = data.data.organization.name
              organizationSlug = data.data.organization.slug
            }
          }
        } catch (apiError) {
          console.warn('Failed to fetch organization data from API:', apiError)
        }

        setUserData({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || 'User',
          organization: {
            name: organizationName,
            slug: organizationSlug
          }
        })
      } catch (error) {
        console.error('Dashboard layout load error:', error)
        router.push('/auth/signin')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const navigation = [
    {
      name: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home, current: pathname === '/dashboard' }
      ]
    },
    {
      name: 'Work',
      items: [
        { name: 'Clients', href: '/dashboard/clients', icon: Users, current: pathname.startsWith('/dashboard/clients') },
        { name: 'Deliverables', href: '/dashboard/deliverables', icon: CheckSquare, current: pathname.startsWith('/dashboard/deliverables') },
        { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen, current: pathname.startsWith('/dashboard/projects') }
      ]
    },
    {
      name: 'Management',
      items: [
        { name: 'Service Types', href: '/dashboard/service-types', icon: Briefcase, current: pathname.startsWith('/dashboard/service-types') },
        { name: 'Team', href: '/dashboard/team', icon: Users, current: pathname.startsWith('/dashboard/team') },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, current: pathname.startsWith('/dashboard/analytics') },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: pathname.startsWith('/dashboard/settings') }
      ]
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return <div>Error loading dashboard</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left: Logo & Org Name */}
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 p-0"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex h-8 w-8 p-0"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className={`font-semibold text-gray-900 transition-opacity duration-200 ${
              sidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : ''
            }`}>
              {userData.organization.name}
            </span>
          </div>
          
          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients, deliverables..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
          </div>
          
          {/* Right: User Menu */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar
                size="sm"
                fallback={userData.name.charAt(0).toUpperCase()}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                leftIcon={<LogOut className="h-4 w-4" />}
                className="hidden sm:flex"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <nav className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-6">
              {navigation.map((section) => (
                <div key={section.name}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.name}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Button
                        key={item.name}
                        variant="ghost"
                        fullWidth
                        className={`justify-start ${
                          item.current
                            ? 'bg-brand bg-opacity-10 text-brand'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          router.push(item.href)
                          setMobileMenuOpen(false)
                        }}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block bg-white border-r border-gray-200 fixed left-0 top-16 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <nav className="p-4 space-y-6">
            {navigation.map((section) => (
              <div key={section.name}>
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.name}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Button
                      key={item.name}
                      variant="ghost"
                      fullWidth={!sidebarCollapsed}
                      className={`${sidebarCollapsed ? 'w-8 h-8 p-0' : 'justify-start'} ${
                        item.current
                          ? 'bg-brand bg-opacity-10 text-brand'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => router.push(item.href)}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                      {!sidebarCollapsed && item.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* AI Chat Assistant - Hidden on main dashboard, shown on other pages */}
      <AIChat hideOnDashboard={true} />
    </div>
  )
} 