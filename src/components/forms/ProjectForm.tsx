'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { 
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  X,
  Users
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

// Types
interface Client {
  id: string
  name: string
  slug: string
  status: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
}

interface ProjectFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  clients: Client[]
  users: User[]
  initialData?: any
  mode?: 'create' | 'edit'
}

// Form validation schema
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  estimatedHours: z.string().optional().transform(val => val === '' ? undefined : val),
  budgetAmount: z.string().optional().transform(val => val === '' ? undefined : val),
  currency: z.string().default('USD'),
  managerId: z.string().optional().transform(val => val === '' ? undefined : val)
})

type ProjectFormData = z.infer<typeof projectSchema>

export default function ProjectForm({
  isOpen,
  onClose,
  onSubmit,
  clients,
  users,
  initialData,
  mode = 'create'
}: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      clientId: initialData?.clientId || '',
      status: initialData?.status || 'PLANNING',
      priority: initialData?.priority || 'MEDIUM',
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
      endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
      estimatedHours: initialData?.estimatedHours?.toString() || '',
      budgetAmount: initialData?.budgetAmount?.toString() || '',
      currency: initialData?.currency || 'USD',
      managerId: initialData?.managerId || ''
    }
  })

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
            
            // Auto-assign admin users as project manager if creating new project
            if (mode === 'create' && currentUserData.role === 'ADMIN' && !initialData?.managerId) {
              form.setValue('managerId', currentUserData.id)
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

  const handleSubmit = async (data: ProjectFormData) => {
    setIsLoading(true)
    try {
      console.log('ProjectForm submitting data:', data)
      await onSubmit(data)
      form.reset()
      toast.success(mode === 'create' ? 'Project created successfully!' : 'Project updated successfully!')
      onClose()
    } catch (error) {
      console.error('Project form submission error:', error)
      toast.error(mode === 'create' ? 'Failed to create project' : 'Failed to update project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      onClose()
    }
  }

  // Sort users to show admins first
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1
    return a.name.localeCompare(b.name)
  })

  // Filter clients to show only active ones
  const activeClients = clients.filter(client => client.status === 'ACTIVE')

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create New Project' : 'Edit Project'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'create' 
                ? 'Set up a new project to organize deliverables and track progress'
                : 'Update the project details and settings'
              }
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <FileText className="h-4 w-4 mr-2" />
                Project Information
              </CardTitle>
              <CardDescription>
                Basic details about the project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <Input
                  {...form.register('name')}
                  placeholder="e.g., Website Redesign, SEO Campaign Q1 2024"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...form.register('description')}
                  placeholder="Describe the project scope, goals, and key objectives..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...form.register('clientId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Client</option>
                    {activeClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.clientId && (
                    <p className="text-xs text-red-500">{form.formState.errors.clientId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Project Manager</label>
                  <select
                    {...form.register('managerId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">No Manager Assigned</option>
                    {sortedUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.role === 'ADMIN' && '🛡️ (Admin)'}
                      </option>
                    ))}
                  </select>
                  {currentUser?.role === 'ADMIN' && mode === 'create' && (
                    <p className="text-xs text-emerald-600 flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      You're auto-assigned as project manager
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Target className="h-4 w-4 mr-2" />
                Status & Priority
              </CardTitle>
              <CardDescription>
                Set the current status and priority level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    {...form.register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="PLANNING">📋 Planning</option>
                    <option value="ACTIVE">🚀 Active</option>
                    <option value="ON_HOLD">⏸️ On Hold</option>
                    <option value="COMPLETED">✅ Completed</option>
                    <option value="CANCELLED">❌ Cancelled</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <select
                    {...form.register('priority')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="LOW">🔵 Low</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="URGENT">🔴 Urgent</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline & Budget
              </CardTitle>
              <CardDescription>
                Set project dates, time estimates, and budget information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <Input
                    type="date"
                    {...form.register('startDate')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <Input
                    type="date"
                    {...form.register('endDate')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Estimated Hours
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    {...form.register('estimatedHours')}
                    placeholder="e.g., 40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Budget Amount
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('budgetAmount')}
                    placeholder="e.g., 5000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Currency</label>
                  <select
                    {...form.register('currency')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

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
                mode === 'create' ? 'Create Project' : 'Update Project'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
} 