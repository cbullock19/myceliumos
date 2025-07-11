'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import ServiceTypeBadge from '@/components/ui/service-type-badge'
import { 
  Plus,
  MoreVertical,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  GripVertical,
  Filter,
  Search,
  X,
  Building
} from 'lucide-react'

// Types
interface Deliverable {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  createdAt: string
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
    email: string
    role: string
    avatarUrl?: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count: {
    comments: number
  }
}

interface KanbanColumn {
  id: string
  title: string
  status: string
  color: string
  deliverables: Deliverable[]
}

interface DeliverableKanbanProps {
  deliverables: Deliverable[]
  onStatusChange: (deliverableId: string, newStatus: string) => Promise<void>
  onDeliverableClick: (deliverable: Deliverable) => void
  onEditDeliverable: (deliverable: Deliverable) => void
  onDeleteDeliverable: (deliverable: Deliverable) => void
  onCreateDeliverable: () => void
  isLoading?: boolean
}

// Kanban column definitions
const KANBAN_COLUMNS: Omit<KanbanColumn, 'deliverables'>[] = [
  {
    id: 'pending',
    title: 'To Do',
    status: 'PENDING',
    color: 'bg-gray-100 border-gray-200'
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    status: 'IN_PROGRESS',
    color: 'bg-blue-100 border-blue-200'
  },
  {
    id: 'review',
    title: 'Review',
    status: 'NEEDS_REVIEW',
    color: 'bg-yellow-100 border-yellow-200'
  },
  {
    id: 'approval',
    title: 'Approval',
    status: 'NEEDS_APPROVAL',
    color: 'bg-orange-100 border-orange-200'
  },
  {
    id: 'completed',
    title: 'Completed',
    status: 'COMPLETED',
    color: 'bg-green-100 border-green-200'
  }
]

export default function DeliverableKanban({
  deliverables,
  onStatusChange,
  onDeliverableClick,
  onEditDeliverable,
  onDeleteDeliverable,
  onCreateDeliverable,
  isLoading = false
}: DeliverableKanbanProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [draggedDeliverable, setDraggedDeliverable] = useState<Deliverable | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    client: '',
    serviceType: '',
    assignee: '',
    priority: ''
  })

  // Initialize columns with deliverables
  useEffect(() => {
    const columnsWithDeliverables = KANBAN_COLUMNS.map(column => ({
      ...column,
      deliverables: deliverables.filter(d => d.status === column.status)
    }))
    setColumns(columnsWithDeliverables)
  }, [deliverables])

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, deliverable: Deliverable) => {
    setDraggedDeliverable(deliverable)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    
    if (!draggedDeliverable) return

    const targetColumn = KANBAN_COLUMNS.find(col => col.id === columnId)
    if (!targetColumn || draggedDeliverable.status === targetColumn.status) {
      setDraggedDeliverable(null)
      setDragOverColumn(null)
      return
    }

    try {
      await onStatusChange(draggedDeliverable.id, targetColumn.status)
    } catch (error) {
      console.error('Failed to update deliverable status:', error)
    }

    setDraggedDeliverable(null)
    setDragOverColumn(null)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedDeliverable(null)
    setDragOverColumn(null)
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const config = {
      LOW: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      MEDIUM: { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
      HIGH: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      URGENT: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
    }
    const config_ = config[priority as keyof typeof config] || config.MEDIUM
    return <Badge className={`text-xs ${config_.color}`}>{config_.label}</Badge>
  }

  // Get urgency indicator
  const getUrgencyIndicator = (deliverable: Deliverable) => {
    if (!deliverable.dueDate) return null

    const now = new Date()
    const dueDate = new Date(deliverable.dueDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    } else if (daysUntilDue <= 1) {
      return <Clock className="w-4 h-4 text-orange-500" />
    } else if (daysUntilDue <= 3) {
      return <Clock className="w-4 h-4 text-yellow-500" />
    }

    return null
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Filter deliverables
  const filteredColumns = columns.map(column => ({
    ...column,
    deliverables: column.deliverables.filter(deliverable => {
      if (filters.client && deliverable.client.id !== filters.client) return false
      if (filters.serviceType && deliverable.serviceType.id !== filters.serviceType) return false
      if (filters.assignee && deliverable.assignedUser?.id !== filters.assignee) return false
      if (filters.priority && deliverable.priority !== filters.priority) return false
      return true
    })
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Deliverables</h2>
          <p className="text-sm text-gray-500">
            {deliverables.length} total deliverables
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={onCreateDeliverable}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Deliverable
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  value={filters.client}
                  onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Clients</option>
                  {Array.from(new Set(deliverables.map(d => d.client.id))).map(clientId => {
                    const client = deliverables.find(d => d.client.id === clientId)?.client
                    return (
                      <option key={clientId} value={clientId}>
                        {client?.name}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  value={filters.serviceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Service Types</option>
                  {Array.from(new Set(deliverables.map(d => d.serviceType.id))).map(serviceTypeId => {
                    const serviceType = deliverables.find(d => d.serviceType.id === serviceTypeId)?.serviceType
                    return (
                      <option key={serviceTypeId} value={serviceTypeId}>
                        {serviceType?.name}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <select
                  value={filters.assignee}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Assignees</option>
                  {Array.from(new Set(deliverables.map(d => d.assignedUser?.id).filter(Boolean))).map(userId => {
                    const user = deliverables.find(d => d.assignedUser?.id === userId)?.assignedUser
                    return (
                      <option key={userId} value={userId}>
                        {user?.name}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {filteredColumns.map((column) => (
          <div
            key={column.id}
            className={`rounded-lg border-2 p-4 ${column.color} ${
              dragOverColumn === column.id ? 'ring-2 ring-emerald-500' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            onDragEnd={handleDragEnd}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <p className="text-sm text-gray-600">
                  {column.deliverables.length} deliverable{column.deliverables.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Deliverables */}
            <div className="space-y-3">
              {column.deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deliverable)}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-move"
                >
                  {/* Drag Handle */}
                  <div className="flex items-start justify-between mb-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-1">
                      {getUrgencyIndicator(deliverable)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeliverableClick(deliverable)}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {deliverable.title}
                  </h4>

                  {/* Service Type Badge */}
                  <div className="mb-2">
                    <ServiceTypeBadge serviceType={deliverable.serviceType} />
                  </div>

                  {/* Priority */}
                  <div className="mb-2">
                    {getPriorityBadge(deliverable.priority)}
                  </div>

                  {/* Client */}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Building className="w-3 h-3 mr-1" />
                    {deliverable.client.name}
                  </div>

                  {/* Assignee */}
                  {deliverable.assignedUser && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <User className="w-3 h-3 mr-1" />
                      {deliverable.assignedUser.name}
                    </div>
                  )}

                  {/* Due Date */}
                  {deliverable.dueDate && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(deliverable.dueDate)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      {deliverable._count.comments > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {deliverable._count.comments} comment{deliverable._count.comments !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditDeliverable(deliverable)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteDeliverable(deliverable)}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {column.deliverables.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No deliverables</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 