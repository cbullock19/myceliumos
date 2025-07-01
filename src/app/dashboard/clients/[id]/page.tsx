'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getClientById, deleteClient, type Client } from '@/lib/clients'
import { formatDateSafe } from '@/lib/utils'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Globe,
  MapPin,
  Calendar,
  FileText,
  Users,
  CheckSquare,
  Clock,
  MoreVertical,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadClient = async () => {
      try {
        const clientData = await getClientById(clientId)
        if (!clientData) {
          toast.error('Client not found')
          router.push('/dashboard/clients')
          return
        }
        setClient(clientData)
      } catch (error) {
        console.error('Error loading client:', error)
        toast.error('Failed to load client details')
        router.push('/dashboard/clients')
      } finally {
        setIsLoading(false)
      }
    }

    if (clientId) {
      loadClient()
    }
  }, [clientId, router])

  const handleEdit = () => {
    router.push(`/dashboard/clients/${clientId}/edit`)
  }

  const handleDelete = async () => {
    if (!client) return
    
    const confirmMessage = `Are you sure you want to delete ${client.name}? This action cannot be undone and will remove all associated projects and deliverables.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteClient(clientId)
      toast.success('Client deleted successfully')
      router.push('/dashboard/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGoBack = () => {
    router.push('/dashboard/clients')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Client not found</h3>
          <p className="text-gray-600 mb-6">
            The client you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleGoBack}>
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                {client.companyName && (
                  <p className="text-lg text-gray-600 mt-1 flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    {client.companyName}
                  </p>
                )}
              </div>
              <Badge 
                variant={client.status === 'ACTIVE' ? 'success' : 'outline'}
                className="text-sm"
              >
                {client.status}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Client Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.contactEmail && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <a 
                        href={`mailto:${client.contactEmail}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {client.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                
                {client.contactPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <a 
                        href={`tel:${client.contactPhone}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {client.contactPhone}
                      </a>
                    </div>
                  </div>
                )}

                {client.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Website</p>
                      <a 
                        href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {client.website}
                      </a>
                    </div>
                  </div>
                )}

                {client.industry && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Industry</p>
                      <p className="text-sm text-gray-600">{client.industry}</p>
                    </div>
                  </div>
                )}

                {!client.contactEmail && !client.contactPhone && !client.website && !client.industry && (
                  <p className="text-sm text-gray-500 italic">No contact information available</p>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Projects & Deliverables (Placeholder for future implementation) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Projects & Deliverables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Projects and deliverables will be displayed here once implemented.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Metadata */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-600">Active Projects</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-600">Deliverables</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">0</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">0</p>
                    <p className="text-xs text-gray-600">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={client.status === 'ACTIVE' ? 'success' : 'outline'}>
                    {client.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Client ID</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {client.id}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-900">
                    {formatDateSafe(client.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-gray-900">
                    {formatDateSafe(client.updatedAt)}
                  </span>
                </div>

                {client.tags && client.tags.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {client.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => toast.info('Project creation coming soon!')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => toast.info('Deliverable creation coming soon!')}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Add Deliverable
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (client.contactEmail) {
                      window.open(`mailto:${client.contactEmail}`, '_blank')
                    } else {
                      toast.error('No email address available')
                    }
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 