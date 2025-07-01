'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Loader2, User, Building, Mail, Phone, FileText, Settings, Plus, Trash2, Save } from 'lucide-react'
import { Client, ClientAssignment, addClientService, removeClientService, updateServiceStatus, getServiceTypes } from '@/lib/clients'
import { toast } from 'sonner'

const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  companyName: z.string().min(1, "Company name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PAUSED', 'ARCHIVED', 'TERMINATED']).optional(),
  serviceTypeIds: z.array(z.string()).min(1, "At least one service type is required"),
})

export type ClientFormData = z.infer<typeof clientSchema>

interface ServiceType {
  id: string
  name: string
  description?: string
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>
  isLoading?: boolean
  initialData?: Partial<ClientFormData>
  submitButtonText?: string
  serviceTypes?: ServiceType[]
}

interface ClientEditFormProps {
  client: Client
  onSubmit: (data: ClientFormData) => Promise<void>
  isLoading?: boolean
}

// Enhanced Client Edit Form with Service Management
export function ClientEditForm({ client, onSubmit, isLoading = false }: ClientEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [clientAssignments, setClientAssignments] = useState<ClientAssignment[]>(client.assignments || [])
  const [availableServices, setAvailableServices] = useState<ServiceType[]>([])

  // Debug logging
  console.log('ClientEditForm - Client data:', client)
  console.log('ClientEditForm - Client assignments:', client.assignments)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema.omit({ serviceTypeIds: true })),
    defaultValues: {
      name: client.name,
      companyName: client.companyName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      notes: client.notes || '',
      status: client.status
    }
  })

  // Load service types and calculate available services
  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        const types = await getServiceTypes()
        setServiceTypes(types)
        
        // Calculate available services (not already assigned)
        const assignedServiceIds = clientAssignments.map(a => a.serviceTypeId)
        const available = types.filter(type => !assignedServiceIds.includes(type.id))
        setAvailableServices(available)
      } catch (error) {
        console.error('Error loading service types:', error)
        toast.error('Failed to load service types')
      }
    }

    loadServiceTypes()
  }, [clientAssignments])

  const handleFormSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddService = async (serviceTypeId: string) => {
    try {
      const newAssignment = await addClientService(client.id, serviceTypeId)
      setClientAssignments([...clientAssignments, newAssignment])
      toast.success('Service added successfully')
    } catch (error) {
      console.error('Error adding service:', error)
      toast.error('Failed to add service')
    }
  }

  const handleRemoveService = async (assignmentId: string) => {
    try {
      await removeClientService(client.id, assignmentId)
      setClientAssignments(clientAssignments.filter(a => a.id !== assignmentId))
      toast.success('Service removed successfully')
    } catch (error) {
      console.error('Error removing service:', error)
      toast.error('Failed to remove service')
    }
  }

  const handleStatusChange = async (assignmentId: string, newStatus: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED') => {
    try {
      const updatedAssignment = await updateServiceStatus(client.id, assignmentId, newStatus)
      setClientAssignments(clientAssignments.map(a => 
        a.id === assignmentId ? updatedAssignment : a
      ))
      toast.success('Service status updated')
    } catch (error) {
      console.error('Error updating service status:', error)
      toast.error('Failed to update service status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Client Details Form */}
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="mr-2 h-5 w-5" />
            Edit Client Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="mr-1 h-4 w-4" />
                  Client Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter client name"
                  {...register('name')}
                  error={errors.name?.message}
                  disabled={isSubmitting || isLoading}
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700 flex items-center">
                  <Building className="mr-1 h-4 w-4" />
                  Company Name *
                </label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Enter company name"
                  {...register('companyName')}
                  error={errors.companyName?.message}
                  disabled={isSubmitting || isLoading}
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="mr-1 h-4 w-4" />
                  Email Address *
                </label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="Enter email address"
                  {...register('contactEmail')}
                  error={errors.contactEmail?.message}
                  disabled={isSubmitting || isLoading}
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 flex items-center">
                  <Phone className="mr-1 h-4 w-4" />
                  Phone Number
                </label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="Enter phone number (optional)"
                  {...register('contactPhone')}
                  error={errors.contactPhone?.message}
                  disabled={isSubmitting || isLoading}
                />
              </div>

              {/* Client Status */}
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 flex items-center">
                  <Settings className="mr-1 h-4 w-4" />
                  Client Status
                </label>
                <select
                  id="status"
                  {...register('status')}
                  disabled={isSubmitting || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PAUSED">Paused</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center">
                <FileText className="mr-1 h-4 w-4" />
                Notes / Description
              </label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Add any notes or additional information about this client..."
                {...register('notes')}
                disabled={isSubmitting || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Service Management Section */}
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Settings className="mr-2 h-5 w-5" />
            Service Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Services</h3>
            {clientAssignments.length > 0 ? (
              <div className="space-y-3">
                {clientAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">
                        {assignment.serviceType.name}
                      </span>
                      <StatusBadge status={assignment.status} type="service" />
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={assignment.status}
                        onChange={(e) => handleStatusChange(assignment.id, e.target.value as any)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PAUSED">Paused</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveService(assignment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No services assigned to this client yet.</p>
            )}
          </div>

          {/* Add New Services */}
          {availableServices.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableServices.map((serviceType) => (
                  <div key={serviceType.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{serviceType.name}</span>
                      {serviceType.description && (
                        <p className="text-sm text-gray-500">{serviceType.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddService(serviceType.id)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ClientForm({ 
  onSubmit, 
  isLoading = false, 
  initialData = {},
  submitButtonText = "Create Client",
  serviceTypes = []
}: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      ...initialData,
      serviceTypeIds: initialData.serviceTypeIds || []
    }
  })

  const selectedServiceTypes = watch('serviceTypeIds') || []

  const handleServiceTypeChange = (serviceTypeId: string, checked: boolean) => {
    const current = selectedServiceTypes
    if (checked) {
      setValue('serviceTypeIds', [...current, serviceTypeId])
    } else {
      setValue('serviceTypeIds', current.filter(id => id !== serviceTypeId))
    }
  }

  const handleFormSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      if (!initialData.name) {
        reset() // Only reset if this is a new client form
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <User className="mr-2 h-5 w-5" />
          {initialData.name ? 'Edit Client' : 'Add New Client'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Client Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
              <User className="mr-1 h-4 w-4" />
              Client Name *
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter client name"
              {...register('name')}
              error={errors.name?.message}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium text-gray-700 flex items-center">
              <Building className="mr-1 h-4 w-4" />
              Company Name *
            </label>
            <Input
              id="companyName"
              type="text"
              placeholder="Enter company name"
              {...register('companyName')}
              error={errors.companyName?.message}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Client Status (only show for edit mode) */}
          {initialData.name && (
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-gray-700 flex items-center">
                <Settings className="mr-1 h-4 w-4" />
                Client Status
              </label>
              <select
                id="status"
                {...register('status')}
                disabled={isSubmitting || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PAUSED">Paused</option>
                <option value="ARCHIVED">Archived</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              {errors.status && (
                <p className="text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-2">
            <label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 flex items-center">
              <Mail className="mr-1 h-4 w-4" />
              Email Address *
            </label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="Enter email address"
              {...register('contactEmail')}
              error={errors.contactEmail?.message}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 flex items-center">
              <Phone className="mr-1 h-4 w-4" />
              Phone Number
            </label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="Enter phone number (optional)"
              {...register('contactPhone')}
              error={errors.contactPhone?.message}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Service Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Settings className="mr-1 h-4 w-4" />
              Services *
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select which services this client will receive
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {serviceTypes.map((serviceType) => (
                <div key={serviceType.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={`service-${serviceType.id}`}
                    checked={selectedServiceTypes.includes(serviceType.id)}
                    onChange={(e) => handleServiceTypeChange(serviceType.id, e.target.checked)}
                    disabled={isSubmitting || isLoading}
                    className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`service-${serviceType.id}`}
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {serviceType.name}
                    </label>
                    {serviceType.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {serviceType.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.serviceTypeIds && (
              <p className="text-sm text-red-600">{errors.serviceTypeIds.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center">
              <FileText className="mr-1 h-4 w-4" />
              Notes / Description
            </label>
            <textarea
              id="notes"
              rows={4}
              placeholder="Add any notes or additional information about this client..."
              {...register('notes')}
              disabled={isSubmitting || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || isLoading}
              onClick={() => reset()}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isSubmitting ? 'Creating...' : submitButtonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 