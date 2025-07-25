'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Mail, 
  Shield, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock,
  Download,
  MessageSquare,
  CheckSquare
} from 'lucide-react'
import { toast } from 'sonner'

interface ClientUser {
  id: string
  email: string
  name: string
  role: 'PRIMARY' | 'COLLABORATOR'
  isActive: boolean
  emailVerified: boolean
  lastLoginAt?: string
  canApprove: boolean
  canDownload: boolean
  canComment: boolean
  createdAt: string
  updatedAt: string
}

interface ClientUserManagementProps {
  clientId: string
  clientName: string
}

export default function ClientUserManagement({ clientId, clientName }: ClientUserManagementProps) {
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const loadClientUsers = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/users`)
      if (!response.ok) {
        throw new Error('Failed to load client users')
      }
      const result = await response.json()
      setClientUsers(result.data.clientUsers)
    } catch (error) {
      console.error('Error loading client users:', error)
      toast.error('Failed to load client users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClientUsers()
  }, [clientId])

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(userId)
    try {
      const response = await fetch(`/api/clients/${clientId}/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete client user')
      }

      toast.success('Client user deleted successfully')
      loadClientUsers() // Reload the list
    } catch (error) {
      console.error('Error deleting client user:', error)
      toast.error('Failed to delete client user')
    } finally {
      setIsDeleting(null)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'PRIMARY':
        return 'Primary Contact'
      case 'COLLABORATOR':
        return 'Collaborator'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PRIMARY':
        return 'bg-blue-100 text-blue-800'
      case 'COLLABORATOR':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Client Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            <span className="ml-3 text-gray-600">Loading client users...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Client Users ({clientUsers.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadClientUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {clientUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500 mb-2">No client users yet</p>
            <p className="text-xs text-gray-400">
              Invite client users to give them access to the client portal
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientUsers.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </p>
                      </div>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {user.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {user.emailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {user.canApprove && (
                        <span className="flex items-center">
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Can Approve
                        </span>
                      )}
                      {user.canDownload && (
                        <span className="flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          Can Download
                        </span>
                      )}
                      {user.canComment && (
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Can Comment
                        </span>
                      )}
                    </div>

                    {/* Last Login */}
                    {user.lastLoginAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        Last login: {formatDate(user.lastLoginAt)}
                      </p>
                    )}

                    {/* Created Date */}
                    <p className="text-xs text-gray-400 mt-1">
                      Invited: {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      disabled={isDeleting === user.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      {isDeleting === user.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 