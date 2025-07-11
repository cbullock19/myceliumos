'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckSquare,
  Calendar,
  Clock,
  User,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  FileText,
  ThumbsUp,
  MessageSquare
} from 'lucide-react'

// Types
interface Deliverable {
  id: string
  title: string
  description?: string
  status: string
  dueDate?: string
  serviceType: {
    name: string
    color?: string
  }
  assignedUser?: {
    name: string
  }
  project?: {
    name: string
  }
  needsApproval: boolean
  hasComments: boolean
  hasFiles: boolean
}

interface DeliverablesData {
  deliverables: Deliverable[]
  stats: {
    totalDeliverables: number
    pendingApprovals: number
    completedThisMonth: number
    overdue: number
  }
}

export default function ClientPortalDeliverablesPage() {
  const [deliverablesData, setDeliverablesData] = useState<DeliverablesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const loadDeliverablesData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/client-portal/deliverables')
        // const data = await response.json()
        // setDeliverablesData(data.data)

        // Mock data for now
        setDeliverablesData({
          deliverables: [
            {
              id: '1',
              title: 'Website Homepage Design',
              description: 'Complete homepage design with responsive layout and modern UI',
              status: 'COMPLETED',
              dueDate: '2024-01-15',
              serviceType: { name: 'Web Design', color: '#3B82F6' },
              assignedUser: { name: 'Sarah Johnson' },
              project: { name: 'Website Redesign' },
              needsApproval: false,
              hasComments: true,
              hasFiles: true
            },
            {
              id: '2',
              title: 'Social Media Content Calendar',
              description: 'Monthly content calendar for all social media platforms',
              status: 'IN_PROGRESS',
              dueDate: '2024-01-20',
              serviceType: { name: 'Social Media', color: '#8B5CF6' },
              assignedUser: { name: 'Mike Chen' },
              project: { name: 'Social Media Campaign' },
              needsApproval: false,
              hasComments: true,
              hasFiles: false
            },
            {
              id: '3',
              title: 'Logo Design Final Files',
              description: 'Final logo files in all required formats and sizes',
              status: 'NEEDS_APPROVAL',
              dueDate: '2024-01-18',
              serviceType: { name: 'Branding', color: '#F59E0B' },
              assignedUser: { name: 'Alex Rodriguez' },
              project: { name: 'Brand Identity Package' },
              needsApproval: true,
              hasComments: false,
              hasFiles: true
            },
            {
              id: '4',
              title: 'SEO Keyword Research',
              description: 'Comprehensive keyword research and optimization strategy',
              status: 'PENDING',
              dueDate: '2024-01-25',
              serviceType: { name: 'SEO', color: '#10B981' },
              assignedUser: { name: 'David Kim' },
              project: { name: 'Website Redesign' },
              needsApproval: false,
              hasComments: false,
              hasFiles: false
            }
          ],
          stats: {
            totalDeliverables: 4,
            pendingApprovals: 1,
            completedThisMonth: 2,
            overdue: 0
          }
        })
      } catch (error) {
        console.error('Error loading deliverables data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDeliverablesData()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': { color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔄' },
      'PENDING': { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '⏳' },
      'NEEDS_APPROVAL': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '👀' },
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

  const filteredDeliverables = deliverablesData?.deliverables.filter(deliverable => {
    if (statusFilter === 'all') return true
    return deliverable.status === statusFilter
  }) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!deliverablesData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load deliverables</h2>
        <p className="text-gray-600">Please try refreshing the page or contact your project team.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Deliverables
        </h1>
        <p className="text-gray-600">
          Review and approve deliverables, track progress, and access project files.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deliverables</p>
                <p className="text-2xl font-bold text-gray-900">{deliverablesData.stats.totalDeliverables}</p>
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
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">{deliverablesData.stats.pendingApprovals}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ThumbsUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed This Month</p>
                <p className="text-2xl font-bold text-green-600">{deliverablesData.stats.completedThisMonth}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{deliverablesData.stats.overdue}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 mr-2" />
              All Deliverables
            </div>
            <div className="flex space-x-2">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'NEEDS_APPROVAL' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('NEEDS_APPROVAL')}
              >
                Needs Approval
              </Button>
              <Button
                variant={statusFilter === 'IN_PROGRESS' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('IN_PROGRESS')}
              >
                In Progress
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDeliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{deliverable.title}</h3>
                      {getStatusBadge(deliverable.status)}
                                             {deliverable.needsApproval && (
                         <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                           Needs Approval
                         </Badge>
                       )}
                    </div>
                    <p className="text-gray-600 mb-3">{deliverable.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Due: {formatDate(deliverable.dueDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{deliverable.assignedUser?.name}</span>
                      </div>
                      {deliverable.project && (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>{deliverable.project.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {deliverable.hasFiles && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Files
                      </Button>
                    )}
                    {deliverable.hasComments && (
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Comments
                      </Button>
                    )}
                                         {deliverable.needsApproval && (
                       <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                         <ThumbsUp className="h-4 w-4 mr-1" />
                         Approve
                       </Button>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-8 text-center">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">More Features Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            We're working on adding approval workflows, file uploads, and real-time collaboration features.
          </p>
          <p className="text-sm text-gray-500">
            Contact your project team for the latest updates and approval requests.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 