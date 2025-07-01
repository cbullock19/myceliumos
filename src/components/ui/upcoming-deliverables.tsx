'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import ServiceTypeBadge from '@/components/ui/service-type-badge'
import { 
  CheckSquare, 
  Calendar,
  Clock,
  AlertTriangle,
  User,
  Plus
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Deliverable {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  client: {
    id: string
    name: string
    slug: string
  }
  serviceType: {
    id: string
    name: string
    slug: string
    color?: string
  }
  assignedUser?: {
    id: string
    name: string
    avatarUrl?: string
  }
}

interface UpcomingDeliverablesProps {
  upcomingTasks: Deliverable[]
  todaysTasks: Deliverable[]
  overdueTasks: Deliverable[]
  className?: string
}

export default function UpcomingDeliverables({ 
  upcomingTasks, 
  todaysTasks, 
  overdueTasks, 
  className = "" 
}: UpcomingDeliverablesProps) {
  const router = useRouter()

  // Combine and sort all tasks by urgency
  const allTasks = [
    ...overdueTasks.map(task => ({ ...task, urgency: 'overdue' })),
    ...todaysTasks.map(task => ({ ...task, urgency: 'today' })),
    ...upcomingTasks.map(task => ({ ...task, urgency: 'upcoming' }))
  ].slice(0, 8) // Show max 8 items

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'today': return <Clock className="h-4 w-4 text-orange-500" />
      case 'upcoming': return <Calendar className="h-4 w-4 text-blue-500" />
      default: return <CheckSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDueDate = (dueDate: string | null, urgency: string) => {
    if (!dueDate) return 'No due date'
    
    const date = new Date(dueDate)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (urgency === 'overdue') {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`
    } else if (urgency === 'today') {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (allTasks.length === 0) {
    return (
      <Card className={`${className} h-full flex flex-col`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckSquare className="mr-2 h-5 w-5" />
            Upcoming Deliverables
          </CardTitle>
          <CardDescription>
            Items due in the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up! 🎉</h3>
            <p className="text-gray-600 mb-4">
              No upcoming deliverables. Great work!
            </p>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/deliverables')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Deliverable
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} h-full flex flex-col`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CheckSquare className="mr-2 h-5 w-5" />
              Upcoming Deliverables
            </CardTitle>
            <CardDescription>
              {overdueTasks.length > 0 && `${overdueTasks.length} overdue • `}
              {todaysTasks.length > 0 && `${todaysTasks.length} due today • `}
              {upcomingTasks.length} upcoming
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/deliverables')}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="space-y-1">
          {allTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => router.push(`/dashboard/deliverables?id=${task.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getUrgencyIcon(task.urgency)}
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                    <span className="truncate">{task.client.name}</span>
                    <span>•</span>
                    <ServiceTypeBadge 
                      serviceType={task.serviceType}
                      size="sm"
                      variant="subtle"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                      
                      <span className={`text-xs font-medium ${
                        task.urgency === 'overdue' ? 'text-red-600' :
                        task.urgency === 'today' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {formatDueDate(task.dueDate, task.urgency)}
                      </span>
                    </div>

                    {task.assignedUser && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500 truncate max-w-[80px]">
                          {task.assignedUser.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {(allTasks.length > 0) && (
          <div className="p-4 border-t bg-gray-50">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => router.push('/dashboard/deliverables')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Deliverable
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 