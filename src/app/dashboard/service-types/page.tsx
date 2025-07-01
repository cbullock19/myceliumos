'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Archive,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Layers,
  MoreVertical
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import ServiceTypeForm from '@/components/forms/ServiceTypeForm'

// Types
interface ServiceType {
  id: string
  name: string
  slug: string
  description?: string
  workflowType: 'recurring' | 'project' | 'milestone'
  isActive: boolean
  sortOrder: number
  color?: string
  createdAt: string
  updatedAt: string
  deliverableFields: DeliverableField[]
  _count: {
    deliverables: number
    clientAssignments: number
  }
}

interface DeliverableField {
  id: string
  name: string
  type: 'TEXT' | 'TEXTAREA' | 'DATE' | 'URL' | 'SELECT' | 'NUMBER' | 'CHECKBOX'
  isRequired: boolean
  sortOrder: number
  defaultValue?: string
  options?: string[]
}

interface ServiceTypeStats {
  totalServiceTypes: number
  activeServiceTypes: number
  totalDeliverables: number
  totalClients: number
  avgDeliverablesPerService: number
  mostUsedService: ServiceType | null
}

export default function ServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [stats, setStats] = useState<ServiceTypeStats>({
    totalServiceTypes: 0,
    activeServiceTypes: 0,
    totalDeliverables: 0,
    totalClients: 0,
    avgDeliverablesPerService: 0,
    mostUsedService: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [workflowFilter, setWorkflowFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Load initial data
  useEffect(() => {
    loadData()
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData.data)
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/service-types', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const serviceTypesData = data.data || []
        setServiceTypes(serviceTypesData)
        calculateStats(serviceTypesData)
      } else {
        throw new Error('Failed to fetch service types')
      }
    } catch (error) {
      console.error('Error loading service types:', error)
      toast.error('Failed to load service types')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (serviceTypesData: ServiceType[]) => {
    const totalServiceTypes = serviceTypesData.length
    const activeServiceTypes = serviceTypesData.filter(st => st.isActive).length
    const totalDeliverables = serviceTypesData.reduce((sum, st) => sum + st._count.deliverables, 0)
    const totalClients = serviceTypesData.reduce((sum, st) => sum + st._count.clientAssignments, 0)
    const avgDeliverablesPerService = totalServiceTypes > 0 ? Math.round(totalDeliverables / totalServiceTypes) : 0
    
    // Find most used service (by deliverables count)
    const mostUsedService = serviceTypesData.length > 0 
      ? serviceTypesData.reduce((prev, current) => 
          (prev._count.deliverables > current._count.deliverables) ? prev : current
        )
      : null

    setStats({
      totalServiceTypes,
      activeServiceTypes,
      totalDeliverables,
      totalClients,
      avgDeliverablesPerService,
      mostUsedService
    })
  }

  const handleCreateServiceType = () => {
    setEditingServiceType(null)
    setShowCreateModal(true)
  }

  const handleEditServiceType = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType)
    setShowCreateModal(true)
  }

  const handleDuplicateServiceType = async (serviceType: ServiceType) => {
    try {
      // Create a copy with modified name
      const duplicateData = {
        name: `${serviceType.name} (Copy)`,
        description: serviceType.description,
        workflowType: serviceType.workflowType,
        deliverableFields: serviceType.deliverableFields.map(field => ({
          name: field.name,
          type: field.type,
          isRequired: field.isRequired,
          defaultValue: field.defaultValue,
          options: field.options
        }))
      }

      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/service-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(duplicateData)
      })

      if (response.ok) {
        toast.success('Service type duplicated successfully!')
        loadData()
      } else {
        throw new Error('Failed to duplicate service type')
      }
    } catch (error) {
      console.error('Error duplicating service type:', error)
      toast.error('Failed to duplicate service type')
    }
  }

  const handleToggleStatus = async (serviceType: ServiceType) => {
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/service-types/${serviceType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          isActive: !serviceType.isActive
        })
      })

      if (response.ok) {
        toast.success(`Service type ${serviceType.isActive ? 'archived' : 'activated'} successfully!`)
        loadData()
      } else {
        throw new Error('Failed to update service type status')
      }
    } catch (error) {
      console.error('Error updating service type status:', error)
      toast.error('Failed to update service type status')
    }
  }

  const handleDeleteServiceType = async (serviceType: ServiceType) => {
    if (!confirm(`Are you sure you want to delete "${serviceType.name}"?\n\nThis will affect ${serviceType._count.deliverables} deliverables and ${serviceType._count.clientAssignments} client assignments.`)) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/service-types/${serviceType.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        toast.success('Service type deleted successfully!')
        loadData()
      } else {
        throw new Error('Failed to delete service type')
      }
    } catch (error) {
      console.error('Error deleting service type:', error)
      toast.error('Failed to delete service type')
    }
  }

  // Filter service types
  const filteredServiceTypes = serviceTypes.filter(serviceType => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        serviceType.name.toLowerCase().includes(searchLower) ||
        (serviceType.description?.toLowerCase().includes(searchLower) || false)
      
      if (!matchesSearch) return false
    }

    // Workflow filter
    if (workflowFilter && serviceType.workflowType !== workflowFilter) {
      return false
    }

    // Status filter
    if (statusFilter === 'active' && !serviceType.isActive) {
      return false
    }
    if (statusFilter === 'archived' && serviceType.isActive) {
      return false
    }

    return true
  })

  const getWorkflowBadge = (workflowType: string) => {
    const variants = {
      'recurring': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔄' },
      'project': { color: 'bg-green-100 text-green-700 border-green-200', icon: '📋' },
      'milestone': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🎯' }
    }
    
    const variant = variants[workflowType as keyof typeof variants] || variants.project
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variant.color}`}>
        <span className="mr-1">{variant.icon}</span>
        {workflowType.charAt(0).toUpperCase() + workflowType.slice(1)}
      </span>
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setWorkflowFilter('')
    setStatusFilter('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Check if user is admin
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can manage service types.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Types</h1>
          <p className="text-gray-600">
            Manage your agency's service offerings and deliverable templates
          </p>
        </div>
        <Button
          onClick={handleCreateServiceType}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service Type
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalServiceTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeServiceTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deliverables</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliverables}</p>
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
                <p className="text-sm font-medium text-gray-600">Avg per Service</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgDeliverablesPerService}</p>
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
                  placeholder="Search service types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={workflowFilter}
                onChange={(e) => setWorkflowFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              >
                <option value="">All Workflows</option>
                <option value="recurring">Recurring</option>
                <option value="project">Project</option>
                <option value="milestone">Milestone</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>

              {(searchTerm || workflowFilter || statusFilter) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Types Grid */}
      {filteredServiceTypes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Types Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || workflowFilter || statusFilter 
                  ? "No service types match your current filters."
                  : "Get started by creating your first service type."
                }
              </p>
              {!searchTerm && !workflowFilter && !statusFilter && (
                <Button onClick={handleCreateServiceType}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Service Type
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServiceTypes.map((serviceType) => (
            <Card key={serviceType.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0"
                        style={{ backgroundColor: serviceType.color || '#10B981' }}
                        title={`Service color: ${serviceType.color || '#10B981'}`}
                      />
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {serviceType.name}
                      </CardTitle>
                      {!serviceType.isActive && (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                          Archived
                        </Badge>
                      )}
                    </div>
                    {serviceType.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {serviceType.description}
                      </p>
                    )}
                    {getWorkflowBadge(serviceType.workflowType)}
                  </div>
                  
                  <div className="relative">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {/* Dropdown menu would go here */}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{serviceType._count.deliverables}</p>
                    <p className="text-xs text-gray-600">Deliverables</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{serviceType._count.clientAssignments}</p>
                    <p className="text-xs text-gray-600">Clients</p>
                  </div>
                </div>

                {/* Fields Preview */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Deliverable Fields ({serviceType.deliverableFields.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {serviceType.deliverableFields.slice(0, 3).map((field) => (
                      <Badge key={field.id} variant="outline" className="text-xs">
                        {field.name}
                      </Badge>
                    ))}
                    {serviceType.deliverableFields.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        +{serviceType.deliverableFields.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditServiceType(serviceType)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateServiceType(serviceType)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(serviceType)}
                    className={serviceType.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                  {serviceType._count.deliverables === 0 && serviceType._count.clientAssignments === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteServiceType(serviceType)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Service Type Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-auto">
            <div className="p-8">
              <ServiceTypeForm
                serviceType={editingServiceType}
                onSave={(savedServiceType) => {
                  setShowCreateModal(false)
                  setEditingServiceType(null)
                  loadData() // Refresh the data
                  toast.success(`Service type ${editingServiceType ? 'updated' : 'created'} successfully!`)
                }}
                onCancel={() => {
                  setShowCreateModal(false)
                  setEditingServiceType(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 