'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  Plus,
  Search,
  Filter,
  FolderOpen,
  Calendar,
  Clock,
  Users,
  CheckSquare,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  Archive
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import ProjectForm from '@/components/forms/ProjectForm'

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
  deliverables: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate?: string
    assignedUser?: {
      id: string
      name: string
    }
  }>
  _count: {
    deliverables: number
  }
}

interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalDeliverables: number
  overdueDeliverables: number
  completionRate: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalDeliverables: 0,
    overdueDeliverables: 0,
    completionRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Load projects, clients, and users in parallel
      const [projectsResponse, clientsResponse, usersResponse] = await Promise.all([
        fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/users/team', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ])

      if (projectsResponse.ok) {
        const data = await projectsResponse.json()
        const projectsData = data.data || []
        setProjects(projectsData)
        calculateStats(projectsData)
      } else {
        throw new Error('Failed to fetch projects')
      }

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData.data?.clients || [])
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.data || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (projectsData: Project[]) => {
    const totalProjects = projectsData.length
    const activeProjects = projectsData.filter(p => p.status === 'ACTIVE').length
    const completedProjects = projectsData.filter(p => p.status === 'COMPLETED').length
    const totalDeliverables = projectsData.reduce((sum, p) => sum + p._count.deliverables, 0)
    
    // Calculate overdue deliverables
    const today = new Date()
    const overdueDeliverables = projectsData.reduce((sum, project) => {
      return sum + project.deliverables.filter(d => 
        d.dueDate && 
        new Date(d.dueDate) < today && 
        !['COMPLETED', 'APPROVED'].includes(d.status)
      ).length
    }, 0)
    
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0

    setStats({
      totalProjects,
      activeProjects,
      completedProjects,
      totalDeliverables,
      overdueDeliverables,
      completionRate
    })
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

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'LOW': 'bg-gray-100 text-gray-700',
      'MEDIUM': 'bg-blue-100 text-blue-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'URGENT': 'bg-red-100 text-red-700'
    }
    
    return (
      <Badge variant="outline" className={`text-xs ${variants[priority as keyof typeof variants] || variants.MEDIUM}`}>
        {priority}
      </Badge>
    )
  }

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return 'No dates set'
    
    const formatDate = (date: string) => new Date(date).toLocaleDateString()
    
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    } else if (startDate) {
      return `Starts ${formatDate(startDate)}`
    } else {
      return `Due ${formatDate(endDate!)}`
    }
  }

  const getProjectProgress = (project: Project) => {
    if (project._count.deliverables === 0) return 0
    
    const completedDeliverables = project.deliverables.filter(d => 
      ['COMPLETED', 'APPROVED'].includes(d.status)
    ).length
    
    return Math.round((completedDeliverables / project._count.deliverables) * 100)
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        project.name.toLowerCase().includes(searchLower) ||
        (project.description?.toLowerCase().includes(searchLower) || false) ||
        project.client.name.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter && project.status !== statusFilter) {
      return false
    }

    // Client filter
    if (clientFilter && project.client.id !== clientFilter) {
      return false
    }

    return true
  })

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setClientFilter('')
  }

  const handleCreateProject = async (data: any) => {
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadData() // Refresh the list
        toast.success('Project created successfully!')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  const handleEditProject = async (data: any) => {
    if (!editingProject) return

    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadData() // Refresh the list
        setEditingProject(null)
        toast.success('Project updated successfully!')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            Manage client projects and track deliverable progress
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CheckSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deliverables</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliverables}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueDeliverables}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-amber-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              >
                <option value="">All Status</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {(searchTerm || statusFilter || clientFilter) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter || clientFilter 
                  ? "No projects match your current filters."
                  : "Get started by creating your first project."
                }
              </p>
              {!searchTerm && !statusFilter && !clientFilter && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const progress = getProjectProgress(project)
            const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'COMPLETED'
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {project.name}
                        </CardTitle>
                        {isOverdue && (
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-600 border-red-200">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        {getStatusBadge(project.status)}
                        {getPriorityBadge(project.priority)}
                      </div>

                      <p className="text-sm text-gray-600 font-medium mb-1">
                        {project.client.name}
                      </p>
                      
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="relative">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">Progress</span>
                      <span className="text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{project._count.deliverables}</p>
                      <p className="text-xs text-gray-600">Deliverables</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {project.deliverables.filter(d => ['COMPLETED', 'APPROVED'].includes(d.status)).length}
                      </p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDateRange(project.startDate, project.endDate)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        // Navigate to project detail page
                        window.location.href = `/dashboard/projects/${project.id}`
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProject(project)
                        setShowCreateModal(true)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Project Modal */}
      <ProjectForm
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingProject(null)
        }}
        onSubmit={editingProject ? handleEditProject : handleCreateProject}
        clients={clients}
        users={users}
        initialData={editingProject}
        mode={editingProject ? 'edit' : 'create'}
      />
    </div>
  )
} 