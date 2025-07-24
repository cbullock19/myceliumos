'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, Shield, CheckSquare, Download, MessageSquare, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const inviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['PRIMARY', 'VIEWER', 'ADMIN']),
  canApprove: z.boolean().default(false),
  canDownload: z.boolean().default(true),
  canComment: z.boolean().default(true)
})

type InviteFormData = z.infer<typeof inviteSchema>

interface ClientInviteModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
}

export default function ClientInviteModal({ isOpen, onClose, clientId, clientName }: ClientInviteModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'VIEWER',
      canApprove: false,
      canDownload: true,
      canComment: true
    }
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/client-auth/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          clientId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'A user with this email already exists') {
          toast.error('A user with this email already exists')
        } else {
          toast.error(result.error || 'Failed to send invitation')
        }
        return
      }

      toast.success('Invitation sent successfully!')
      reset()
      onClose()
    } catch (error) {
      console.error('Invitation error:', error)
      toast.error('Failed to send invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      reset()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Invite Client User</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Inviting user to: <strong>{clientName}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  {...register('name')}
                  className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter full name"
                  disabled={isLoading}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Enter email address"
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="space-y-2">
                {[
                  { value: 'PRIMARY', label: 'Primary Contact', description: 'Full access, can approve deliverables' },
                  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access to projects and files' },
                  { value: 'ADMIN', label: 'Admin', description: 'Can manage other client users' }
                ].map((role) => (
                  <label key={role.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value={role.value}
                      {...register('role')}
                      className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{role.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('canApprove')}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    disabled={isLoading || selectedRole === 'PRIMARY'}
                  />
                  <div className="flex items-center">
                    <CheckSquare className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">Can approve deliverables</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('canDownload')}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    disabled={isLoading}
                  />
                  <div className="flex items-center">
                    <Download className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">Can download files</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('canComment')}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    disabled={isLoading}
                  />
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">Can add comments</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 