'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckSquare,
  Clock,
  Download,
  Eye,
  FileText,
  AlertTriangle,
  Calendar,
  User,
  FolderOpen,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Types
interface Deliverable {
  id: string
  title: string
  status: string
  dueDate?: string
  completedAt?: string
  serviceType: {
    name: string
    color: string
  }
  assignedUser?: {
    name: string
  }
  _count?: {
    comments: number
  }
}

interface DashboardData {
  recentDeliverables: Deliverable[]
  pendingApprovals: Deliverable[]
  todaysDeliverables: Deliverable[]
  overdueDeliverables: Deliverable[]
  upcomingDeliverables: Deliverable[]
  fileAccessSummary: {
    totalFiles: number
    recentDownloads: number
    pendingUploads: number
  }
  stats: {
    totalDeliverables: number
    completedThisMonth: number
    overdue: number
    pendingApprovals: number
  }
  client: {
    id: string
    name: string
    slug: string
  }
  organization: {
    id: string
    name: string
    branding?: {
      primaryColor: string
    }
  }
  user: {
    id: string
    name: string
    email: string
    role: string
    permissions: {
      canApprove: boolean
      canDownload: boolean
      canComment: boolean
    }
  }
}

export default function ClientPortalDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetch('/api/client-portal/dashboard')
        
        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }
        
        const result = await response.json()
        setDashboardData(result.data)
      } catch (error) {
        console.error('Dashboard load error:', error)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
      'NEEDS_REVIEW': { color: 'bg-orange-100 text-orange-800', icon: Eye },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'OVERDUE': { color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatRelativeDate = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${diffDays} days`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Failed to load dashboard'}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {dashboardData.user.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your projects at {dashboardData.organization.name}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deliverables</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalDeliverables}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed This Month</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {dashboardData.user.permissions.canApprove && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="h-5 w-5 mr-2" />
              Recent Deliverables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentDeliverables.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentDeliverables.slice(0, 5).map((deliverable) => (
                  <div key={deliverable.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{deliverable.title}</h4>
                      <div className="flex items-center mt-1 space-x-2">
                        {getStatusBadge(deliverable.status)}
                        <span className="text-sm text-gray-500">
                          {deliverable.serviceType.name}
                        </span>
                        {deliverable.assignedUser && (
                          <span className="text-sm text-gray-500">
                            • {deliverable.assignedUser.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{formatDate(deliverable.dueDate)}</p>
                      <p className="text-xs text-gray-500">{formatRelativeDate(deliverable.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent deliverables</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        {dashboardData.user.permissions.canApprove && dashboardData.pendingApprovals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.pendingApprovals.slice(0, 5).map((deliverable) => (
                  <div key={deliverable.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{deliverable.title}</h4>
                      <div className="flex items-center mt-1 space-x-2">
                        {getStatusBadge(deliverable.status)}
                        <span className="text-sm text-gray-500">
                          {deliverable.serviceType.name}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Deliverables */}
        {dashboardData.todaysDeliverables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Due Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.todaysDeliverables.map((deliverable) => (
                  <div key={deliverable.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{deliverable.title}</h4>
                      <div className="flex items-center mt-1 space-x-2">
                        {getStatusBadge(deliverable.status)}
                        <span className="text-sm text-gray-500">
                          {deliverable.serviceType.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">Due Today</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overdue Deliverables */}
        {dashboardData.overdueDeliverables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.overdueDeliverables.slice(0, 5).map((deliverable) => (
                  <div key={deliverable.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{deliverable.title}</h4>
                      <div className="flex items-center mt-1 space-x-2">
                        {getStatusBadge(deliverable.status)}
                        <span className="text-sm text-gray-500">
                          {deliverable.serviceType.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {formatRelativeDate(deliverable.dueDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                <FolderOpen className="h-6 w-6 mb-2" />
                View All Projects
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                <CheckSquare className="h-6 w-6 mb-2" />
                View All Deliverables
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                <Download className="h-6 w-6 mb-2" />
                Access Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 