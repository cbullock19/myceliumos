'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import ServiceTypeBadge from '@/components/ui/service-type-badge'
import { getClients, deleteClient, type Client } from '@/lib/clients'
import { formatDateSafe } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Building, 
  Edit, 
  Trash2,
  Eye,
  FileText,
  Filter,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceType {
  id: string
  name: string
  slug: string
  color?: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('')
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>('')

  useEffect(() => {
    const loadClientsData = async () => {
      try {
        // Load service types for filters
        const serviceTypesResponse = await fetch('/api/service-types', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || ''}`
          }
        })
        
        if (serviceTypesResponse.ok) {
          const serviceTypesData = await serviceTypesResponse.json()
          setServiceTypes(serviceTypesData.data || [])
        }

        // Build query parameters for filtering
        const params = new URLSearchParams()
        if (statusFilter) params.append('status', statusFilter)
        if (serviceTypeFilter) params.append('serviceTypeId', serviceTypeFilter)
        if (serviceStatusFilter) params.append('serviceStatus', serviceStatusFilter)

        const clientsData = await getClients({
          status: statusFilter || undefined,
          serviceTypeId: serviceTypeFilter || undefined,
          serviceStatus: serviceStatusFilter || undefined
        })
        setClients(clientsData)
        setFilteredClients(clientsData)
      } catch (error) {
        console.error('Error loading clients:', error)
        toast.error('Failed to load clients')
      } finally {
        setIsLoading(false)
      }
    }

    loadClientsData()
  }, [statusFilter, serviceTypeFilter, serviceStatusFilter])

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredClients(filtered)
  }, [searchQuery, clients])

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteClient(clientId)
      setClients(clients.filter(client => client.id !== clientId))
      toast.success('Client deleted successfully')
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  const handleAddClient = () => {
    router.push('/dashboard/clients/new')
  }

  const handleEditClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}/edit`)
  }

  const handleViewClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="mr-3 h-8 w-8" />
                Clients
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your client relationships and contacts
              </p>
            </div>
            <Button
              onClick={handleAddClient}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Client
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-3 items-center">
              <Filter className="h-4 w-4 text-gray-500" />
              
              {/* Client Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PAUSED">Paused</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {/* Service Type Filter */}
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Services</option>
                {serviceTypes.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>

              {/* Service Status Filter */}
              <select
                value={serviceStatusFilter}
                onChange={(e) => setServiceStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Service Status</option>
                <option value="ACTIVE">Active Services</option>
                <option value="COMPLETED">Completed Services</option>
                <option value="PAUSED">Paused Services</option>
                <option value="CANCELLED">Cancelled Services</option>
              </select>

              {/* Clear Filters */}
              {(statusFilter || serviceTypeFilter || serviceStatusFilter || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('')
                    setServiceTypeFilter('')
                    setServiceStatusFilter('')
                    setSearchQuery('')
                  }}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Client Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No clients found' : 'No clients yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms.'
                  : 'Get started by creating your first client.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={handleAddClient} leftIcon={<Plus className="h-4 w-4" />}>
                  Add Your First Client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {client.name}
                      </CardTitle>
                      {client.companyName && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Building className="h-4 w-4 mr-1" />
                          {client.companyName}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={client.status} type="client" size="sm" />
                  </div>
                  
                  {/* Service Types */}
                  {client.assignments && client.assignments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {client.assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center gap-1">
                          <ServiceTypeBadge 
                            serviceType={assignment.serviceType}
                            size="sm"
                            variant="subtle"
                          />
                          <StatusBadge 
                            status={assignment.status} 
                            type="service" 
                            size="sm" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-gray-600">
                    {client.contactEmail && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{client.contactEmail}</span>
                      </div>
                    )}
                    {client.contactPhone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{client.contactPhone}</span>
                      </div>
                    )}
                    {client._count && (
                      <div className="flex items-center text-xs text-gray-500 mt-3">
                        <FileText className="h-3 w-3 mr-1" />
                        {client._count.deliverables} deliverable{client._count.deliverables !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Created {formatDateSafe(client.createdAt)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClient(client.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClient(client.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 