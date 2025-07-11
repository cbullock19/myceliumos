'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  GripVertical,
  Eye,
  BarChart3,
  FolderOpen,
  ChevronRight,
  MoreVertical
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import MilestoneForm from '@/components/forms/MilestoneForm'
import ProjectTimeline from '@/components/ui/project-timeline'

// Types
interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate?: string
  endDate?: string
  estimatedHours?: number
  budgetAmount?: number
  currency: string
  managerId?: string
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
    status: string
  }
  manager?: {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string
  }
  milestones: Milestone[]
  deliverables: Deliverable[]
}

interface Milestone {
  id: string
  name: string
  description?: string
  startDate?: string
  dueDate?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  sortOrder: number
  deliverables: Deliverable[]
}

interface Deliverable {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  assignedUser?: {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string
  }
  serviceType: {
    id: string
    name: string
    slug: string
  }
  client: {
    id: string
    name: string
  }
}

type TabType = 'overview' | 'milestones' | 'timeline'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }

      const data = await response.json()
      setProject(data.data)
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMilestone = async (data: any) => {
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create milestone')
      }

      toast.success('Milestone created successfully')
      setShowMilestoneModal(false)
      loadProject()
    } catch (error) {
      console.error('Error creating milestone:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create milestone')
    }
  }

  const handleEditMilestone = async (data: any) => {
    if (!editingMilestone) return

    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/milestones/${editingMilestone.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update milestone')
      }

      toast.success('Milestone updated successfully')
      setShowMilestoneModal(false)
      setEditingMilestone(null)
      loadProject()
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update milestone')
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return

    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete milestone')
      }

      toast.success('Milestone deleted successfully')
      loadProject()
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete milestone')
    }
  }

  const handleReorderMilestones = async (milestones: Milestone[]) => {
    setIsReordering(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/milestones/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          milestones: milestones.map((milestone, index) => ({
            id: milestone.id,
            sortOrder: index
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reorder milestones')
      }

      toast.success('Milestones reordered successfully')
      loadProject()
    } catch (error) {
      console.error('Error reordering milestones:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reorder milestones')
    } finally {
      setIsReordering(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'PLANNING': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '📋' },
      'ACTIVE': { color: 'bg-green-100 text-green-700 border-green-200', icon: '🚀' },
      'ON_HOLD': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⏸️' },
      'COMPLETED': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
      'CANCELLED': { color: 'bg-red-100 text-red-700 border-red-200', icon: '❌' }
    }
    
    const variant = variants[status as keyof typeof variants] || variants.PLANNING
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variant.color}`}>
        <span className="mr-1">{variant.icon}</span>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getMilestoneStatusBadge = (status: string) => {
    const variants = {
      'PENDING': { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '⏳' },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔄' },
      'COMPLETED': { color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
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
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/projects')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">Project Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(project.status)}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'milestones', label: 'Milestones', icon: Target },
            { id: 'timeline', label: 'Timeline', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <p className="text-lg font-semibold text-gray-900">{project.client.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Manager</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {project.manager?.name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-gray-900">{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="text-gray-900">{formatDate(project.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Hours</label>
                  <p className="text-gray-900">{project.estimatedHours || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Budget</label>
                  <p className="text-gray-900">
                    {project.budgetAmount 
                      ? `${project.currency} ${project.budgetAmount.toLocaleString()}`
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
              {project.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Milestones</p>
                    <p className="text-2xl font-bold">{project.milestones.length}</p>
                  </div>
                  <Target className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Deliverables</p>
                    <p className="text-2xl font-bold">{project.deliverables.length}</p>
                  </div>
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {project.milestones.filter(m => m.status === 'COMPLETED').length}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">
                      {project.milestones.filter(m => m.status === 'OVERDUE').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="space-y-6">
          {/* Milestones Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Project Milestones</h2>
              <p className="text-sm text-gray-600">
                {project.milestones.length} milestone{project.milestones.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={() => setShowMilestoneModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          {/* Milestones List */}
          <div className="space-y-4">
            {project.milestones.map((milestone, index) => (
              <Card key={milestone.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <h3 className="text-lg font-medium text-gray-900">{milestone.name}</h3>
                        {getMilestoneStatusBadge(milestone.status)}
                      </div>
                      
                      {milestone.description && (
                        <p className="text-gray-600 mb-3">{milestone.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {formatDate(milestone.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Due: {formatDate(milestone.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-4 w-4" />
                          <span>{milestone.deliverables.length} deliverable{milestone.deliverables.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Deliverables */}
                      {milestone.deliverables.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Deliverables</h4>
                          <div className="space-y-2">
                            {milestone.deliverables.map((deliverable) => (
                              <div
                                key={deliverable.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{deliverable.title}</p>
                                  <p className="text-sm text-gray-600">
                                    {deliverable.assignedUser?.name || 'Unassigned'} • {deliverable.serviceType.name}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <StatusBadge status={deliverable.status} />
                                  {deliverable.dueDate && (
                                    <span className="text-xs text-gray-500">
                                      Due: {formatDate(deliverable.dueDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingMilestone(milestone)
                          setShowMilestoneModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {project.milestones.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Target className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first milestone to start organizing your project deliverables.
                  </p>
                  <Button onClick={() => setShowMilestoneModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Milestone
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <ProjectTimeline project={project} />
      )}

      {/* Milestone Form Modal */}
      <MilestoneForm
        isOpen={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false)
          setEditingMilestone(null)
        }}
        onSubmit={editingMilestone ? handleEditMilestone : handleCreateMilestone}
        initialData={editingMilestone}
        mode={editingMilestone ? 'edit' : 'create'}
      />
    </div>
  )
} 