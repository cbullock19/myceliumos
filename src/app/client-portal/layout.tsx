'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Home,
  FolderOpen,
  CheckSquare,
  Download,
  User,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

// Types
interface ClientUser {
  id: string
  email: string
  name: string
  role: 'PRIMARY' | 'VIEWER' | 'ADMIN'
  title?: string
  phone?: string
  lastLoginAt?: string
}

interface OrganizationBranding {
  primaryColor: string
  logoUrl?: string
  companyName: string
  customCSS?: string
}

interface ClientPortalLayoutProps {
  children: React.ReactNode
}

export default function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [clientUser, setClientUser] = useState<ClientUser | null>(null)
  const [organizationBranding, setOrganizationBranding] = useState<OrganizationBranding | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsCount, setNotificationsCount] = useState(0)

  useEffect(() => {
    const loadClientSession = async () => {
      try {
        // Check if we have a client session
        const response = await fetch('/api/client-auth/me')
        
        if (response.ok) {
          const data = await response.json()
          setClientUser(data.data.clientUser)
          setOrganizationBranding(data.data.organizationBranding)
        } else {
          // No valid client session, redirect to login
          if (pathname !== '/client-portal/login' && pathname !== '/client-portal/setup-password') {
            router.push('/client-portal/login')
          }
        }
      } catch (error) {
        console.error('Error loading client session:', error)
        if (pathname !== '/client-portal/login' && pathname !== '/client-portal/setup-password') {
          router.push('/client-portal/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadClientSession()
  }, [pathname, router])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/client-auth/logout', {
        method: 'POST'
      })

      if (response.ok) {
        setClientUser(null)
        router.push('/client-portal/login')
        toast.success('Logged out successfully')
      } else {
        throw new Error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/client-portal/dashboard', icon: Home },
    { name: 'Projects', href: '/client-portal/projects', icon: FolderOpen },
    { name: 'Deliverables', href: '/client-portal/deliverables', icon: CheckSquare },
    { name: 'Files', href: '/client-portal/files', icon: Download },
    { name: 'Profile', href: '/client-portal/profile', icon: User }
  ]

  // Don't show layout on login/setup pages
  if (pathname === '/client-portal/login' || pathname === '/client-portal/setup-password') {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (!clientUser) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {organizationBranding?.logoUrl ? (
                  <img 
                    className="h-8 w-auto" 
                    src={organizationBranding.logoUrl} 
                    alt={organizationBranding.companyName}
                  />
                ) : (
                  <div 
                    className="h-8 w-32 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded flex items-center justify-center"
                    style={{ 
                      backgroundColor: organizationBranding?.primaryColor || '#059669'
                    }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {organizationBranding?.companyName || 'Client Portal'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4 text-sm text-gray-500">
                Welcome, {clientUser.name}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="h-5 w-5" />
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationsCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
                  <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 font-medium">
                      {clientUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block">{clientUser.name}</span>
                </button>
              </div>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>
              Powered by {organizationBranding?.companyName || 'Mycelium OS'}
            </p>
            <p className="mt-1">
              Need help? Contact your project team
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 