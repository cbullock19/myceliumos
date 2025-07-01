'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import ServiceTypeBadge from '@/components/ui/service-type-badge'
import DeliverableForm from '@/components/forms/DeliverableForm'
import { 
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Grid3X3,
  List,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'

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
  }
  assignedUser?: {
    id: string
    name: string
    email: string
    role: string
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

interface Client {
  id: string
  name: string
  slug: string
}

interface ServiceType {
  id: string
  name: string
  slug: string
  deliverableFields: any[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
}

interface DeliverableStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  dueToday: number
  dueThisWeek: number
}

type ViewMode = 'list' | 'kanban' | 'calendar'

export default function DeliverablesPage() {
  const router = useRouter()
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState<DeliverableStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null)
  const [showDeliverableModal, setShowDeliverableModal] = useState(false)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Find current user in the users list
          const currentUserData = users.find(u => u.id === user.id)
          if (currentUserData) {
            setCurrentUser(currentUserData)
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }

    if (users.length > 0) {
      getCurrentUser()
    }
  }, [users])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const [deliverablesRes, clientsRes, serviceTypesRes, usersRes, projectsRes] = await Promise.all([
        fetch('/api/deliverables', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/service-types', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/users/team', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ])

      if (deliverablesRes.ok) {
        const deliverablesData = await deliverablesRes.json()
        const deliverablesList = deliverablesData.data.deliverables || []
        setDeliverables(deliverablesList)
        calculateStats(deliverablesList)
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.data?.clients || [])
      }

      if (serviceTypesRes.ok) {
        const serviceTypesData = await serviceTypesRes.json()
        setServiceTypes(serviceTypesData.data || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.data || [])
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (deliverablesList: Deliverable[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const newStats: DeliverableStats = {
      total: deliverablesList.length,
      pending: deliverablesList.filter(d => d.status === 'PENDING').length,
      inProgress: deliverablesList.filter(d => d.status === 'IN_PROGRESS').length,
      completed: deliverablesList.filter(d => d.status === 'COMPLETED').length,
      overdue: deliverablesList.filter(d => {
        if (!d.dueDate) return false
        return new Date(d.dueDate) < today && d.status !== 'COMPLETED'
      }).length,
      dueToday: deliverablesList.filter(d => {
        if (!d.dueDate) return false
        const dueDate = new Date(d.dueDate)
        return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000) && d.status !== 'COMPLETED'
      }).length,
      dueThisWeek: deliverablesList.filter(d => {
        if (!d.dueDate) return false
        const dueDate = new Date(d.dueDate)
        return dueDate >= today && dueDate <= weekFromNow && d.status !== 'COMPLETED'
      }).length
    }

    setStats(newStats)
  }

  const handleCreateDeliverable = async (data: any) => {
    try {
      const response = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadData() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create deliverable')
      }
    } catch (error) {
      console.error('Error creating deliverable:', error)
      throw error
    }
  }

  const handleEditDeliverable = async (data: any) => {
    if (!editingDeliverable) return

    try {
      const response = await fetch(`/api/deliverables/${editingDeliverable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadData() // Refresh the list
        setEditingDeliverable(null)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update deliverable')
      }
    } catch (error) {
      console.error('Error updating deliverable:', error)
      throw error
    }
  }

  const handleDeleteDeliverable = async (deliverable: Deliverable) => {
    if (!confirm(`Are you sure you want to delete "${deliverable.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/deliverables/${deliverable.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete deliverable')
      }
    } catch (error) {
      console.error('Error deleting deliverable:', error)
      alert('Failed to delete deliverable')
    }
  }

  const handleStatusChange = async (deliverable: Deliverable, newStatus: string) => {
    try {
      const response = await fetch(`/api/deliverables/${deliverable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadData() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setClientFilter('')
    setAssigneeFilter('')
    setPriorityFilter('')
  }

  // Filter deliverables based on search and filters
  const filteredDeliverables = deliverables.filter(deliverable => {
    // User filtering - only show assigned deliverables unless admin
    if (currentUser && currentUser.role !== 'ADMIN') {
      if (!deliverable.assignedUser || deliverable.assignedUser.id !== currentUser.id) {
        return false
      }
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        deliverable.title.toLowerCase().includes(searchLower) ||
        deliverable.client.name.toLowerCase().includes(searchLower) ||
        deliverable.serviceType.name.toLowerCase().includes(searchLower) ||
        (deliverable.assignedUser?.name.toLowerCase().includes(searchLower) || false)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter && deliverable.status !== statusFilter) {
      return false
    }

    // Priority filter
    if (priorityFilter && deliverable.priority !== priorityFilter) {
      return false
    }

    // Client filter
    if (clientFilter && deliverable.client.id !== clientFilter) {
      return false
    }

    // Assignee filter
    if (assigneeFilter && (!deliverable.assignedUser || deliverable.assignedUser.id !== assigneeFilter)) {
      return false
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status as any} type="deliverable" />
  }

  const getPriorityBadge = (priority: string) => {
    const config = {
      LOW: { color: 'bg-gray-100 text-gray-700', icon: null },
      MEDIUM: { color: 'bg-blue-100 text-blue-700', icon: null },
      HIGH: { color: 'bg-orange-100 text-orange-700', icon: null },
      URGENT: { color: 'bg-red-100 text-red-700', icon: AlertTriangle }
    }

    const { color, icon: Icon } = config[priority as keyof typeof config] || config.MEDIUM

    return (
      <Badge className={`${color} text-xs font-medium`}>
        {Icon && <Icon className="h-3 w-3 mr-1" />}
        {priority}
      </Badge>
    )
  }

  const getUrgencyIndicator = (deliverable: Deliverable) => {
    if (!deliverable.dueDate) return null

    const now = new Date()
    const dueDate = new Date(deliverable.dueDate)
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0 && deliverable.status !== 'COMPLETED') {
      return (
        <div className="flex items-center text-red-600 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </div>
      )
    }

    if (diffDays === 0 && deliverable.status !== 'COMPLETED') {
      return (
        <div className="flex items-center text-orange-600 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Due today
        </div>
      )
    }

    if (diffDays === 1 && deliverable.status !== 'COMPLETED') {
      return (
        <div className="flex items-center text-yellow-600 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Due tomorrow
        </div>
      )
    }

    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`

    return date.toLocaleDateString()
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getDeliverablesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return filteredDeliverables.filter(deliverable => {
      if (!deliverable.dueDate) return false
      // Handle both ISO string and date-only formats
      const deliverableDateString = deliverable.dueDate.includes('T') 
        ? deliverable.dueDate.split('T')[0]
        : deliverable.dueDate
      return deliverableDateString === dateString
    })
  }

  const formatCalendarDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastDue = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDeliverableClick = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable)
    setShowDeliverableModal(true)
  }

  const handleEditFromModal = () => {
    setEditingDeliverable(selectedDeliverable)
    setShowDeliverableModal(false)
  }

  const handleDeleteFromModal = async () => {
    if (selectedDeliverable) {
      await handleDeleteDeliverable(selectedDeliverable)
      setShowDeliverableModal(false)
      setSelectedDeliverable(null)
    }
  }

  const renderCalendarView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100"></div>
      )
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayDeliverables = getDeliverablesForDate(date)
      const isCurrentDay = isToday(date)
      const isPastDueDay = isPastDue(date)
      
      days.push(
        <div 
          key={day} 
          className={`h-32 border border-gray-200 p-3 transition-all duration-200 hover:shadow-md ${
            isCurrentDay ? 'bg-blue-50 border-blue-300 shadow-sm' : 
            isPastDueDay ? 'bg-red-50/50 border-red-200' : 
            'bg-white hover:bg-gray-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${
              isCurrentDay ? 'text-blue-700' : 
              isPastDueDay ? 'text-red-600' : 
              'text-gray-700'
            }`}>
              {day}
            </span>
            {dayDeliverables.length > 0 && (
                              <Badge 
                  variant={isCurrentDay ? "default" : "outline"} 
                  className={`text-xs h-5 min-w-[20px] ${
                    isCurrentDay ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                {dayDeliverables.length}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1.5 max-h-20 overflow-y-auto">
            {dayDeliverables.slice(0, 2).map(deliverable => {
              const statusColors = {
                'PENDING': 'bg-amber-100 border-amber-200 text-amber-800',
                'IN_PROGRESS': 'bg-blue-100 border-blue-200 text-blue-800',
                'COMPLETED': 'bg-emerald-100 border-emerald-200 text-emerald-800',
                'CANCELLED': 'bg-gray-100 border-gray-200 text-gray-600'
              }
              
              const priorityDots = {
                'LOW': 'bg-gray-400',
                'MEDIUM': 'bg-amber-400',
                'HIGH': 'bg-red-500',
                'URGENT': 'bg-red-600'
              }
              
              return (
                <div 
                  key={deliverable.id}
                  className={`text-xs p-2 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-[1.02] ${
                    statusColors[deliverable.status as keyof typeof statusColors] || 'bg-gray-100 border-gray-200 text-gray-800'
                  }`}
                  onClick={() => handleDeliverableClick(deliverable)}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      priorityDots[deliverable.priority as keyof typeof priorityDots] || 'bg-gray-400'
                    }`}></div>
                    <div className="font-medium truncate flex-1">{deliverable.title}</div>
                  </div>
                  <div className="text-xs opacity-75 truncate">
                    {deliverable.client.name}
                    {deliverable.assignedUser && (
                      <span className="ml-1">• {deliverable.assignedUser.name.split(' ')[0]}</span>
                    )}
                  </div>
                </div>
              )
            })}
            {dayDeliverables.length > 2 && (
              <div 
                className="text-xs text-gray-500 text-center py-1 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => {
                  // Show all deliverables for this day
                  setSelectedDeliverable(dayDeliverables[0])
                  setShowDeliverableModal(true)
                }}
              >
                +{dayDeliverables.length - 2} more
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth)
                  newMonth.setMonth(newMonth.getMonth() - 1)
                  setCurrentMonth(newMonth)
                }}
                className="hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
                {currentMonth.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setCurrentMonth(newMonth)
                }}
                className="hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredDeliverables.filter(d => d.dueDate).length} scheduled deliverables
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="bg-gray-50 px-4 py-3 text-center">
                <span className="text-sm font-semibold text-gray-700">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliverables</h1>
          <p className="text-gray-600">
            {currentUser?.role === 'ADMIN' 
              ? 'Manage all tasks and deliverables for your clients'
              : `Viewing your assigned deliverables (${filteredDeliverables.length} total)`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="h-8"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Deliverable
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Target className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-orange-600">{stats.dueToday}</p>
              </div>
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
              </div>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-purple-600">{stats.dueThisWeek}</p>
              </div>
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search and Primary Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by title, client, or service type..."
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
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="NEEDS_REVIEW">Needs Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>

                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                >
                  <option value="">All Clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>

                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                >
                  <option value="">All Assignees</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>

                {(searchTerm || statusFilter || clientFilter || assigneeFilter || priorityFilter) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Summary */}
            {(searchTerm || statusFilter || clientFilter || assigneeFilter || priorityFilter) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {filteredDeliverables.length} of {deliverables.length} deliverables</span>
                {searchTerm && <Badge variant="outline">Search: "{searchTerm}"</Badge>}
                {statusFilter && <Badge variant="outline">Status: {statusFilter}</Badge>}
                {priorityFilter && <Badge variant="outline">Priority: {priorityFilter}</Badge>}
                {clientFilter && <Badge variant="outline">Client: {clients.find(c => c.id === clientFilter)?.name}</Badge>}
                {assigneeFilter && <Badge variant="outline">Assignee: {users.find(u => u.id === assigneeFilter)?.name}</Badge>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deliverables List */}
      <div className="grid gap-4">
        {viewMode === 'calendar' ? (
          renderCalendarView()
        ) : filteredDeliverables.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliverables found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter || clientFilter || assigneeFilter || priorityFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first deliverable.'
                }
              </p>
              {!searchTerm && !statusFilter && !clientFilter && !assigneeFilter && !priorityFilter && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deliverable
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredDeliverables.map(deliverable => (
            <Card key={deliverable.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {deliverable.title}
                      </h3>
                      {getStatusBadge(deliverable.status)}
                      {getPriorityBadge(deliverable.priority)}
                      {getUrgencyIndicator(deliverable)}
                    </div>

                    {deliverable.description && (
                      <p className="text-gray-600 mb-3">
                        {deliverable.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>{deliverable.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ServiceTypeBadge 
                          serviceType={deliverable.serviceType}
                          size="sm"
                          variant="subtle"
                        />
                      </div>
                      {deliverable.assignedUser && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{deliverable.assignedUser.name}</span>
                        </div>
                      )}
                      {deliverable.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(deliverable.dueDate)}</span>
                        </div>
                      )}
                      {deliverable._count.comments > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{deliverable._count.comments} comments</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {deliverable.status !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(deliverable, 'COMPLETED')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingDeliverable(deliverable)
                        setIsFormOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDeliverable(deliverable)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Deliverable Form Modal */}
      <DeliverableForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingDeliverable(null)
        }}
        onSubmit={editingDeliverable ? handleEditDeliverable : handleCreateDeliverable}
        clients={clients}
        serviceTypes={serviceTypes}
        users={users}
        projects={projects}
        initialData={editingDeliverable}
        mode={editingDeliverable ? 'edit' : 'create'}
      />

      {/* Deliverable Detail Modal */}
      {showDeliverableModal && selectedDeliverable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  selectedDeliverable.priority === 'URGENT' ? 'bg-red-600' :
                  selectedDeliverable.priority === 'HIGH' ? 'bg-red-500' :
                  selectedDeliverable.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-gray-400'
                }`}></div>
                <h2 className="text-xl font-bold text-gray-900">{selectedDeliverable.title}</h2>
                {getStatusBadge(selectedDeliverable.status)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeliverableModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Client</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedDeliverable.client.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service Type</label>
                      <p className="text-gray-900">{selectedDeliverable.serviceType.name}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned To</label>
                      <div className="flex items-center gap-2">
                        {selectedDeliverable.assignedUser ? (
                          <>
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {selectedDeliverable.assignedUser.name.charAt(0)}
                            </div>
                            <span className="text-gray-900">{selectedDeliverable.assignedUser.name}</span>
                          </>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      <p className="text-gray-900">
                        {selectedDeliverable.dueDate 
                          ? formatDate(selectedDeliverable.dueDate)
                          : 'No due date set'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedDeliverable.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900 mt-1 bg-gray-50 p-4 rounded-lg">
                      {selectedDeliverable.description}
                    </p>
                  </div>
                )}

                {/* Priority and Status */}
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <div className="mt-1">
                      {getPriorityBadge(selectedDeliverable.priority)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedDeliverable.status)}
                    </div>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Created by:</span> {selectedDeliverable.createdBy.name}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDate(selectedDeliverable.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteFromModal}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeliverableModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEditFromModal}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 