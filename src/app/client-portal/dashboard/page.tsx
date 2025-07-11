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
  FolderOpen
} from 'lucide-react'

// Types
interface Deliverable {
  id: string
  title: string
  status: string
  dueDate?: string
  serviceType: {
    name: string
  }
  assignedUser?: {
    name: string
  }
}

interface DashboardData {
  recentDeliverables: Deliverable[]
  pendingApprovals: Deliverable[]
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
}

export default function ClientPortalDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/client-portal/dashboard')
        // const data = await response.json()
        // setDashboardData(data.data)

        // Mock data for now
        setDashboardData({
          recentDeliverables: [
            {
              id: '1',
              title: 'Website Homepage Design',
              status: 'COMPLETED',
              dueDate: '2024-01-15',
              serviceType: { name: 'Web Design' },
              assignedUser: { name: 'Sarah Johnson' }
            },
            {
              id: '2',
              title: 'Social Media Content Calendar',
              status: 'IN_PROGRESS',
              dueDate: '2024-01-20',
              serviceType: { name: 'Social Media' },
              assignedUser: { name: 'Mike Chen' }
            },
            {
              id: '3',
              title: 'Brand Identity Guidelines',
              status: 'PENDING',
              dueDate: '2024-01-25',
              serviceType: { name: 'Branding' },
              assignedUser: { name: 'Alex Rodriguez' }
            }
          ],
          pendingApprovals: [
            {
              id: '4',
              title: 'Logo Design Final Files',
              status: 'NEEDS_REVIEW',
              dueDate: '2024-01-18',
              serviceType: { name: 'Branding' },
              assignedUser: { name: 'Alex Rodriguez' }
            }
          ],
          fileAccessSummary: {
            totalFiles: 47,
            recentDownloads: 12,
            pendingUploads: 3
          },
          stats: {
            totalDeliverables: 23,
            completedThisMonth: 8,
            overdue: 1,
            pendingApprovals: 1
          }
        })
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': { color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔄' },
      'PENDING': { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '⏳' },
      'NEEDS_REVIEW': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '👀' },
      'OVERDUE': { color: 'bg-red-100 text-red-700 border-red-200', icon: '⚠️' }
    }
    
    const variant = variants[status as keyof typeof variants] || variants.PENDING
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variant.color}`}>
        <span className="mr-1">{variant.icon}</span>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard</h2>
        <p className="text-gray-600">Please try refreshing the page or contact your project team.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to your Client Portal
        </h1>
        <p className="text-gray-600">
          Track your project progress, review deliverables, and access files all in one place.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deliverables</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalDeliverables}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckSquare className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed This Month</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.stats.completedThisMonth}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.stats.pendingApprovals}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Eye className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.stats.overdue}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
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
            <div className="space-y-4">
              {dashboardData.recentDeliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{deliverable.title}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{deliverable.serviceType.name}</span>
                      <span>•</span>
                      <span>Due: {formatDate(deliverable.dueDate)}</span>
                      {deliverable.assignedUser && (
                        <>
                          <span>•</span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {deliverable.assignedUser.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(deliverable.status)}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All Deliverables
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.pendingApprovals.length > 0 ? (
                dashboardData.pendingApprovals.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{deliverable.title}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>{deliverable.serviceType.name}</span>
                        <span>•</span>
                        <span>Due: {formatDate(deliverable.dueDate)}</span>
                        {deliverable.assignedUser && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {deliverable.assignedUser.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(deliverable.status)}
                      <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                        Review
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending approvals</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Access Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              File Access Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FolderOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{dashboardData.fileAccessSummary.totalFiles}</p>
                <p className="text-sm text-gray-600">Total Files</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Download className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{dashboardData.fileAccessSummary.recentDownloads}</p>
                <p className="text-sm text-gray-600">Recent Downloads</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.fileAccessSummary.pendingUploads}</p>
                <p className="text-sm text-gray-600">Pending Uploads</p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Browse All Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <CheckSquare className="h-6 w-6" />
              <span>View All Deliverables</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <Download className="h-6 w-6" />
              <span>Download Files</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <FileText className="h-6 w-6" />
              <span>Contact Team</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 