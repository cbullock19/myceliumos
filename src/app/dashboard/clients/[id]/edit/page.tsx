'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientEditForm, ClientFormData } from '@/components/forms/ClientForm'
import { getClientById, updateClient, type Client } from '@/lib/clients'
import { toast } from 'sonner'

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = async (data: ClientFormData) => {
    if (!client) return
    
    setIsSubmitting(true)
    try {
      const updatedClient = await updateClient(clientId, {
        name: data.name,
        companyName: data.companyName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        notes: data.notes,
        status: data.status,
      })
      
      toast.success('Client updated successfully!')
      // Update the local client state
      setClient(updatedClient)
    } catch (error) {
      console.error('Client update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update client')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    router.push(`/dashboard/clients/${clientId}`)
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
          <h3 className="text-xl font-medium text-gray-900 mb-2">Client not found</h3>
          <p className="text-gray-600 mb-6">
            The client you're trying to edit doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/dashboard/clients')}>
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client Details
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
              <p className="mt-2 text-gray-600">
                Update {client.name}'s information, status, and manage their services.
              </p>
            </div>
          </div>

          {/* Enhanced Edit Form */}
          <div className="flex justify-center">
            <ClientEditForm
              client={client}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      </div>
  )
} 