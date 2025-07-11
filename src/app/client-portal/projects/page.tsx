'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FolderOpen,
  Calendar,
  Clock,
  User,
  Target,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download
} from 'lucide-react'

// Types
interface Project {
  id: string
  name: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  progress: number
  deliverables: {
    total: number
    completed: number
  }
}

interface ProjectsData {
  projects: Project[]
  stats: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    overdueProjects: number
  }
}

export default function ClientPortalProjectsPage() {
  const [projectsData, setProjectsData] = useState<ProjectsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProjectsData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/client-portal/projects')
        // const data = await response.json()
        // setProjectsData(data.data)

        // Mock data for now
        setProjectsData({
          projects: [
            {
              id: '1',
              name: 'Website Redesign',
              description: 'Complete redesign of company website with modern UI/UX',
              status: 'ACTIVE',
              startDate: '2024-01-01',
              endDate: '2024-03-15',
              progress: 65,
              deliverables: { total: 8, completed: 5 }
            },
            {
              id: '2',
              name: 'Brand Identity Package',
              description: 'Logo design, brand guidelines, and marketing materials',
              status: 'COMPLETED',
              startDate: '2023-12-01',
              endDate: '2024-01-15',
              progress: 100,
              deliverables: { total: 6, completed: 6 }
            },
            {
              id: '3',
              name: 'Social Media Campaign',
              description: 'Q1 social media content and advertising campaign',
              status: 'PLANNING',
              startDate: '2024-02-01',
              endDate: '2024-04-30',
              progress: 0,
              deliverables: { total: 12, completed: 0 }
            }
          ],
          stats: {
            totalProjects: 3,
            activeProjects: 1,
            completedProjects: 1,
            overdueProjects: 0
          }
        })
      } catch (error) {
        console.error('Error loading projects data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectsData()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants = {
      'ACTIVE': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔄' },
      'COMPLETED': { color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
      'PLANNING': { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📋' },
      'ON_HOLD': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⏸️' },
      'OVERDUE': { color: 'bg-red-100 text-red-700 border-red-200', icon: '⚠️' }
    }
    
    const variant = variants[status as keyof typeof variants] || variants.PLANNING
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variant.color}`}>
        <span className="mr-1">{variant.icon}</span>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD'
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!projectsData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load projects</h2>
        <p className="text-gray-600">Please try refreshing the page or contact your project team.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Projects
        </h1>
        <p className="text-gray-600">
          Track the progress of all your active projects and view completed work.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projectsData.stats.totalProjects}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600">{projectsData.stats.activeProjects}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{projectsData.stats.completedProjects}</p>
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
                <p className="text-2xl font-bold text-red-600">{projectsData.stats.overdueProjects}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            All Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {projectsData.projects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      {getStatusBadge(project.status)}
                    </div>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Start: {formatDate(project.startDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>End: {formatDate(project.endDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{project.deliverables.completed}/{project.deliverables.total} deliverables</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Files
                    </Button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
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
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">More Features Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            We're working on adding project timeline views, detailed progress tracking, and file management features.
          </p>
          <p className="text-sm text-gray-500">
            Contact your project team for the latest updates and timeline information.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 