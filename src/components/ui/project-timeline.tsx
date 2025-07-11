'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Target,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  User
} from 'lucide-react'

// Types
interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  startDate?: string
  endDate?: string
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

interface ProjectTimelineProps {
  project: Project
}

export default function ProjectTimeline({ project }: ProjectTimelineProps) {
  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'OVERDUE':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
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

  const calculateTimelinePosition = (date?: string, projectStart?: string, projectEnd?: string) => {
    if (!date || !projectStart || !projectEnd) return 0
    
    const start = new Date(projectStart).getTime()
    const end = new Date(projectEnd).getTime()
    const current = new Date(date).getTime()
    
    if (current < start) return 0
    if (current > end) return 100
    
    return ((current - start) / (end - start)) * 100
  }

  const projectStart = project.startDate
  const projectEnd = project.endDate

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
          <p className="text-sm text-gray-600">
            Visual overview of milestones and deliverables
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Overdue</span>
          </div>
        </div>
      </div>

      {/* Project Timeline Bar */}
      {projectStart && projectEnd && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Calendar className="h-4 w-4 mr-2" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline Bar */}
              <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-emerald-200"></div>
                
                {/* Milestone Markers */}
                {project.milestones.map((milestone) => {
                  const position = calculateTimelinePosition(milestone.dueDate, projectStart, projectEnd)
                  return (
                    <div
                      key={milestone.id}
                      className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${position}%` }}
                    >
                      <div className={`w-4 h-4 rounded-full ${getMilestoneStatusColor(milestone.status)} border-2 border-white shadow-sm`}></div>
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-700">{milestone.name}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Timeline Labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{formatDate(projectStart)}</span>
                <span>{formatDate(projectEnd)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones Timeline */}
      <div className="space-y-4">
        {project.milestones.map((milestone, index) => (
          <Card key={milestone.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getMilestoneStatusColor(milestone.status)}`}></div>
                    <h3 className="text-lg font-medium text-gray-900">{milestone.name}</h3>
                    {getMilestoneStatusBadge(milestone.status)}
                  </div>
                  
                  {milestone.description && (
                    <p className="text-gray-600 mb-3">{milestone.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                </div>
              </div>

              {/* Milestone Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{milestone.deliverables.length > 0 
                    ? `${milestone.deliverables.filter(d => d.status === 'COMPLETED').length}/${milestone.deliverables.length} completed`
                    : 'No deliverables'
                  }</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${milestone.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ 
                      width: `${milestone.deliverables.length > 0 
                        ? (milestone.deliverables.filter(d => d.status === 'COMPLETED').length / milestone.deliverables.length) * 100
                        : 0
                      }%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Deliverables */}
              {milestone.deliverables.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Deliverables
                  </h4>
                  <div className="space-y-2">
                    {milestone.deliverables.map((deliverable) => (
                      <div
                        key={deliverable.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{deliverable.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {deliverable.serviceType.name}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            {deliverable.assignedUser && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{deliverable.assignedUser.name}</span>
                              </div>
                            )}
                            {deliverable.dueDate && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Due: {formatDate(deliverable.dueDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={deliverable.status === 'COMPLETED' ? 'default' : 'outline'}
                            className={deliverable.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}
                          >
                            {deliverable.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {milestone.deliverables.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No deliverables assigned to this milestone</p>
                </div>
              )}
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
              <p className="text-gray-600">
                Create milestones to see them displayed in the timeline view.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 