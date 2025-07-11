'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { createSupabaseClient } from '@/lib/supabase'
import { getClientCount } from '@/lib/clients'
import { 
  Users, 
  CheckSquare, 
  Plus,
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react'
import AIChat from '@/components/ui/ai-chat'
import AIChatEmbedded from '@/components/ui/ai-chat-embedded'
import UpcomingDeliverables from '@/components/ui/upcoming-deliverables'

interface DashboardData {
  user: any
  organization: any
  stats: {
    totalClients: number
    activeDeliverables: number
    overdue: number
    completedThisWeek: number
  }
  recentActivity: any[]
  upcomingDeliverables: any[]
  // Real dashboard data from API
  todaysTasks: any[]
  overdueTasks: any[]
  upcomingTasks: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [currentGreeting, setCurrentGreeting] = useState('')
  const supabase = createSupabaseClient()
  
  const isWelcome = searchParams?.get('welcome') === 'true'
  const isProfileComplete = searchParams?.get('profile-complete') === 'true'

  // Generate dynamic time-based greeting
  const getTimeBasedGreeting = (timezone = 'America/New_York') => {
    const now = new Date()
    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const hour = timeInTimezone.getHours()
    
    if (hour >= 5 && hour < 12) {
      return 'Good morning'
    } else if (hour >= 12 && hour < 18) {
      return 'Good afternoon'
    } else if (hour >= 18 && hour < 22) {
      return 'Good evening'
    } else {
      return 'Good night'
    }
  }

  // Extract first name from full name
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0]
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/auth/signin')
          return
        }

        // Fetch dashboard data from new API
        const [onboardingResponse, dashboardResponse] = await Promise.all([
          fetch('/api/auth/check-onboarding'),
          fetch('/api/dashboard')
        ])
        
        const onboardingData = await onboardingResponse.json()
        
        // Check if dashboard API returned onboarding incomplete error
        if (!dashboardResponse.ok) {
          const dashboardError = await dashboardResponse.json()
          if (dashboardResponse.status === 403 && dashboardError.error?.includes('Onboarding incomplete')) {
            // Redirect to onboarding if not complete
            router.push('/onboarding')
            return
          }
        }
        
        const dashboardApiData = dashboardResponse.ok ? await dashboardResponse.json() : null
        
        // Fetch real client count
        const totalClients = await getClientCount()
        
        const stats = dashboardApiData?.data ? {
          totalClients,
          activeDeliverables: (dashboardApiData.data.statusCounts?.PENDING || 0) + (dashboardApiData.data.statusCounts?.IN_PROGRESS || 0),
          overdue: dashboardApiData.data.overdueTasks?.length || 0,
          completedThisWeek: dashboardApiData.data.recentlyCompleted?.length || 0
        } : {
          totalClients,
          activeDeliverables: 0,
          overdue: 0,
          completedThisWeek: 0
        }

        const data: DashboardData = {
          user: {
            id: user.id,
            email: user.email,
            name: onboardingData.user?.name || user.user_metadata?.name || 'User',
            role: onboardingData.user?.role || 'ADMIN'
          },
          organization: {
            name: onboardingData.organization?.name || user.user_metadata?.companyName || 'Your Agency',
            slug: onboardingData.organization?.slug || 'your-agency'
          },
          stats,
          recentActivity: dashboardApiData?.data?.recentActivity || [],
          upcomingDeliverables: dashboardApiData?.data?.upcomingTasks || [],
          // Real dashboard data
          todaysTasks: dashboardApiData?.data?.todaysTasks || [],
          overdueTasks: dashboardApiData?.data?.overdueTasks || [],
          upcomingTasks: dashboardApiData?.data?.upcomingTasks || []
        }

        setDashboardData(data)
        
        // Set initial greeting using organization timezone
        const timezone = onboardingData.organization?.settings?.timezone || 'America/New_York'
        setCurrentGreeting(getTimeBasedGreeting(timezone))
      } catch (error) {
        console.error('Dashboard load error:', error)
        // Don't redirect on error as layout will handle authentication
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [router, supabase])

  // Update greeting every minute for real-time updates
  useEffect(() => {
    if (!dashboardData) return

    const updateGreeting = () => {
      const timezone = dashboardData.organization?.settings?.timezone || 'America/New_York'
      setCurrentGreeting(getTimeBasedGreeting(timezone))
    }

    // Update greeting immediately and then every minute
    updateGreeting()
    const interval = setInterval(updateGreeting, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [dashboardData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return <div className="p-6">Error loading dashboard</div>
  }

  const handleEntityCreated = (type: 'client' | 'project' | 'deliverable', data: any) => {
    console.log(`AI created ${type}:`, data)
    // Optionally refresh dashboard data or navigate to the new entity
    if (type === 'client') {
      router.push(`/dashboard/clients/${data.id}`)
    } else if (type === 'project') {
      router.push(`/dashboard/projects/${data.id}`)
    } else if (type === 'deliverable') {
      // Refresh dashboard data to show updated stats
      window.location.reload()
    }
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Messages */}
        {isWelcome && (
          <div className="mb-8 bg-gradient-to-r from-brand to-brand-hover rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">🎉 Welcome to Mycelium OS!</h1>
                <p className="mt-2 text-brand-light">
                  Your agency workspace is ready. Start by adding your first client or creating a deliverable.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="bg-white text-brand border-white hover:bg-gray-50"
                onClick={() => router.push('/dashboard/clients/new')}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}

        {isProfileComplete && (
          <div className="mb-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">✨ Profile Complete!</h1>
                <p className="mt-2 text-emerald-100">
                  Welcome to {dashboardData.organization.name}! Your profile is all set up and you're ready to collaborate with your team.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="bg-white text-emerald-600 border-white hover:bg-gray-50"
                onClick={() => router.push('/dashboard/team')}
              >
                Meet Your Team
              </Button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentGreeting}, {getFirstName(dashboardData.user.name)}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your agency today.
            </p>
          </div>
          <Button 
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push('/dashboard/deliverables')}
          >
            New Deliverable
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-md">
                  <CheckSquare className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Deliverables</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeDeliverables}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-md">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-md">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
          {/* AI Assistant - Replaces Recent Activity */}
          <AIChatEmbedded onEntityCreated={handleEntityCreated} />

          {/* Upcoming Deliverables - Now with real data */}
          <UpcomingDeliverables 
            upcomingTasks={dashboardData.upcomingTasks}
            todaysTasks={dashboardData.todaysTasks}
            overdueTasks={dashboardData.overdueTasks}
          />
        </div>
      </div>
    </div>
  )
} 