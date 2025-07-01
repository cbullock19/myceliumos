'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ClientForm, { ClientFormData } from '@/components/forms/ClientForm'
import { createClient } from '@/lib/clients'
import { toast } from 'sonner'
import { createSupabaseClient } from '@/lib/supabase'

interface ServiceType {
  id: string
  name: string
  description?: string
}

export default function NewClientPage() {
  const router = useRouter()
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(true)

  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        // Get proper auth token from Supabase
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
        
        if (!response.ok) {
          throw new Error('Failed to fetch service types')
        }
        
        const data = await response.json()
        setServiceTypes(data.data || [])
      } catch (error) {
        console.error('Error loading service types:', error)
        toast.error('Failed to load service types')
      } finally {
        setIsLoadingServiceTypes(false)
      }
    }

    loadServiceTypes()
  }, [])

  const handleSubmit = async (data: ClientFormData) => {
    try {
      // Include service type IDs in the client data
      const clientData = {
        name: data.name,
        companyName: data.companyName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        notes: data.notes,
        serviceTypeIds: data.serviceTypeIds
      }
      
      await createClient(clientData)
      toast.success('Client created successfully!')
      router.push('/dashboard/clients')
    } catch (error) {
      console.error('Client creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create client')
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  if (isLoadingServiceTypes) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
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
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="mb-4"
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
            <p className="mt-2 text-gray-600">
              Create a new client profile to start managing deliverables and projects.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="flex justify-center">
          <ClientForm 
            onSubmit={handleSubmit} 
            serviceTypes={serviceTypes}
          />
        </div>
      </div>
    </div>
  )
} 