'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { 
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Shield,
  FolderOpen
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'

// Types
interface Client {
  id: string
  name: string
  slug: string
}

interface ServiceType {
  id: string
  name: string
  slug: string
  deliverableFields: DeliverableField[]
}

interface DeliverableField {
  id: string
  name: string
  slug: string
  type: string
  isRequired: boolean
  defaultValue?: string
  placeholder?: string
  helpText?: string
  options?: string
  minLength?: number
  maxLength?: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
}

interface Project {
  id: string
  name: string
  status: string
  client: {
    id: string
    name: string
  }
}

interface DeliverableFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  clients: Client[]
  serviceTypes: ServiceType[]
  users: User[]
  projects?: Project[]
  initialData?: any
  mode?: 'create' | 'edit'
}

// Form validation schema
const deliverableSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  serviceTypeId: z.string().min(1, 'Service type is required'),
  projectId: z.string().optional().transform(val => val === '' ? undefined : val),
  assignedUserId: z.string().optional().transform(val => val === '' ? undefined : val),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  customFields: z.record(z.any()).optional()
})

type DeliverableFormData = z.infer<typeof deliverableSchema>

export default function DeliverableForm({
  isOpen,
  onClose,
  onSubmit,
  clients,
  serviceTypes,
  users,
  projects = [],
  initialData,
  mode = 'create'
}: DeliverableFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)

  const form = useForm<DeliverableFormData>({
    resolver: zodResolver(deliverableSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      clientId: initialData?.clientId || '',
      serviceTypeId: initialData?.serviceTypeId || '',
      projectId: initialData?.projectId || '',
      assignedUserId: initialData?.assignedUserId || '',
      dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
      priority: initialData?.priority || 'MEDIUM',
      customFields: initialData?.customFields || {}
    }
  })

  const watchedServiceTypeId = form.watch('serviceTypeId')
  const watchedClientId = form.watch('clientId')

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
            
            // Auto-assign admin users if creating new deliverable
            if (mode === 'create' && currentUserData.role === 'ADMIN' && !initialData?.assignedUserId) {
              form.setValue('assignedUserId', currentUserData.id)
            }
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }

    if (isOpen && users.length > 0) {
      getCurrentUser()
    }
  }, [isOpen, users, mode, initialData, form])

  // Update selected service type when form changes
  useEffect(() => {
    if (watchedServiceTypeId) {
      const serviceType = serviceTypes.find(st => st.id === watchedServiceTypeId)
      setSelectedServiceType(serviceType || null)
      
      // Fetch clients for this service type
      fetchClientsForServiceType(watchedServiceTypeId)
    } else {
      setSelectedServiceType(null)
      setFilteredClients([])
    }
  }, [watchedServiceTypeId, serviceTypes])

  // Update filtered projects when client changes
  useEffect(() => {
    if (watchedClientId && projects.length > 0) {
      const clientProjects = projects.filter(project => 
        project.client.id === watchedClientId && 
        ['PLANNING', 'ACTIVE'].includes(project.status) // Only show active projects
      )
      setFilteredProjects(clientProjects)
    } else {
      setFilteredProjects([])
    }
  }, [watchedClientId, projects])

  const fetchClientsForServiceType = async (serviceTypeId: string) => {
    setIsLoadingClients(true)
    try {
      // Get proper auth token from Supabase
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/clients?serviceTypeId=${serviceTypeId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      
      const data = await response.json()
      setFilteredClients(data.data?.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      setFilteredClients([])
    } finally {
      setIsLoadingClients(false)
    }
  }

  const handleSubmit = async (data: DeliverableFormData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      form.reset()
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setSelectedServiceType(null)
    setFilteredClients([])
    setCurrentUser(null)
    onClose()
  }

  // Sort users to show admins first
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1
    return a.name.localeCompare(b.name)
  })

  const renderCustomField = (field: DeliverableField) => {
    const fieldName = `customFields.${field.slug}`

    switch (field.type) {
      case 'TEXT':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.name}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              {...form.register(fieldName as any, { 
                required: field.isRequired ? `${field.name} is required` : false,
                minLength: field.minLength ? { value: field.minLength, message: `Minimum ${field.minLength} characters` } : undefined,
                maxLength: field.maxLength ? { value: field.maxLength, message: `Maximum ${field.maxLength} characters` } : undefined
              })}
              placeholder={field.placeholder || field.name}
              defaultValue={field.defaultValue}
            />
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {form.formState.errors.customFields?.[field.slug] && (
              <p className="text-xs text-red-500">{String(form.formState.errors.customFields[field.slug]?.message)}</p>
            )}
          </div>
        )
      case 'TEXTAREA':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.name}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              {...form.register(fieldName as any, { 
                required: field.isRequired ? `${field.name} is required` : false,
                minLength: field.minLength ? { value: field.minLength, message: `Minimum ${field.minLength} characters` } : undefined,
                maxLength: field.maxLength ? { value: field.maxLength, message: `Maximum ${field.maxLength} characters` } : undefined
              })}
              placeholder={field.placeholder || field.name}
              defaultValue={field.defaultValue}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={3}
            />
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {form.formState.errors.customFields?.[field.slug] && (
              <p className="text-xs text-red-500">{String(form.formState.errors.customFields[field.slug]?.message)}</p>
            )}
          </div>
        )
      case 'URL':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.name}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type="url"
              {...form.register(fieldName as any, { 
                required: field.isRequired ? `${field.name} is required` : false,
                pattern: { value: /^https?:\/\/.+/, message: 'Please enter a valid URL' }
              })}
              placeholder={field.placeholder || 'https://example.com'}
              defaultValue={field.defaultValue}
            />
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {form.formState.errors.customFields?.[field.slug] && (
              <p className="text-xs text-red-500">{String(form.formState.errors.customFields[field.slug]?.message)}</p>
            )}
          </div>
        )
      case 'DATE':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.name}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type="date"
              {...form.register(fieldName as any, { 
                required: field.isRequired ? `${field.name} is required` : false
              })}
              defaultValue={field.defaultValue}
            />
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {form.formState.errors.customFields?.[field.slug] && (
              <p className="text-xs text-red-500">{String(form.formState.errors.customFields[field.slug]?.message)}</p>
            )}
          </div>
        )
      case 'DROPDOWN':
        const options = field.options ? field.options.split(',').map(opt => opt.trim()) : []
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.name}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              {...form.register(fieldName as any, { 
                required: field.isRequired ? `${field.name} is required` : false
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              defaultValue={field.defaultValue}
            >
              <option value="">Select {field.name}</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {form.formState.errors.customFields?.[field.slug] && (
              <p className="text-xs text-red-500">{String(form.formState.errors.customFields[field.slug]?.message)}</p>
            )}
          </div>
        )
      case 'CHECKBOX':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...form.register(fieldName as any)}
                defaultChecked={field.defaultValue === 'true'}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                {field.name}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {form.formState.errors.customFields?.[field.slug] && (
              <p className="text-xs text-red-500">{String(form.formState.errors.customFields[field.slug]?.message)}</p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create New Deliverable' : 'Edit Deliverable'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'create' 
                ? 'Add a new task for your team to work on'
                : 'Update the deliverable details'
              }
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <FileText className="h-4 w-4 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  {...form.register('title')}
                  placeholder="e.g., Instagram Post for Product Launch"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...form.register('description')}
                  placeholder="Additional details about this deliverable..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...form.register('serviceTypeId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Service Type</option>
                    {serviceTypes.map(serviceType => (
                      <option key={serviceType.id} value={serviceType.id}>{serviceType.name}</option>
                    ))}
                  </select>
                  {form.formState.errors.serviceTypeId && (
                    <p className="text-xs text-red-500">{form.formState.errors.serviceTypeId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...form.register('clientId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={!watchedServiceTypeId || isLoadingClients}
                  >
                    <option value="">
                      {!watchedServiceTypeId 
                        ? "Select service type first" 
                        : isLoadingClients
                        ? "Loading clients..."
                        : filteredClients.length === 0
                        ? "No clients available for this service"
                        : "Select Client"
                      }
                    </option>
                    {watchedServiceTypeId && !isLoadingClients && filteredClients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  {form.formState.errors.clientId && (
                    <p className="text-xs text-red-500">{form.formState.errors.clientId.message}</p>
                  )}
                  {watchedServiceTypeId && !isLoadingClients && (
                    <p className="text-xs text-gray-500">
                      {filteredClients.length === 0 
                        ? `No clients are currently assigned to ${selectedServiceType?.name}. Add clients to this service type first.`
                        : `Showing ${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''} assigned to ${selectedServiceType?.name}`
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Project Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Project (Optional)
                </label>
                <select
                  {...form.register('projectId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={!watchedClientId}
                >
                  <option value="">
                    {!watchedClientId 
                      ? "Select client first to see projects" 
                      : filteredProjects.length === 0
                      ? "No active projects for this client"
                      : "Standalone deliverable (no project)"
                    }
                  </option>
                  {watchedClientId && filteredProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.status.toLowerCase()})
                    </option>
                  ))}
                </select>
                {watchedClientId && (
                  <p className="text-xs text-gray-500">
                    {filteredProjects.length === 0 
                      ? "This deliverable will be standalone. You can create a project first if needed."
                      : `Found ${filteredProjects.length} active project${filteredProjects.length !== 1 ? 's' : ''} for this client`
                    }
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <User className="h-4 w-4 mr-2" />
                Assignment & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Assigned To</label>
                  <select
                    {...form.register('assignedUserId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {sortedUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.role === 'ADMIN' && <span className="text-emerald-600">(Admin)</span>}
                      </option>
                    ))}
                  </select>
                  {currentUser?.role === 'ADMIN' && mode === 'create' && (
                    <p className="text-xs text-emerald-600 flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      You're auto-assigned as admin (can see all deliverables)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Due Date</label>
                  <Input
                    type="date"
                    {...form.register('dueDate')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <select
                    {...form.register('priority')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {selectedServiceType && selectedServiceType.deliverableFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedServiceType.name} Fields
                </CardTitle>
                <CardDescription>
                  Service-specific fields for this deliverable type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedServiceType.deliverableFields.map(renderCustomField)}
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Deliverable' : 'Update Deliverable'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
} 