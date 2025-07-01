import { createSupabaseClient } from './supabase'

export interface ClientData {
  name: string
  companyName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  serviceTypeIds?: string[]
  status?: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ARCHIVED' | 'TERMINATED'
}

export interface Client {
  id: string
  organizationId: string
  name: string
  slug: string
  contactEmail?: string | null
  contactPhone?: string | null
  contactPerson?: string | null
  companyName?: string | null
  website?: string | null
  industry?: string | null
  address?: any
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ARCHIVED' | 'TERMINATED'
  isPaused: boolean
  pausedAt?: string | null  // ISO date string from API
  pausedReason?: string | null
  notificationEmail?: string | null
  preferredContactMethod?: string | null
  dropboxFolderUrl?: string | null
  driveId?: string | null
  customFields?: any
  notes?: string | null
  tags: string[]
  createdAt: string  // ISO date string from API (e.g., "2025-06-18T03:52:41.524Z")
  updatedAt: string  // ISO date string from API (e.g., "2025-06-18T03:52:41.524Z")
  assignments?: ClientAssignment[]
  _count?: {
    deliverables: number
  }
}

export interface ClientAssignment {
  id: string
  clientId: string
  userId: string
  serviceTypeId: string
  role: 'PRIMARY' | 'SECONDARY' | 'VIEWER'
  isActive: boolean
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
  statusUpdatedAt: string
  statusUpdatedBy?: string | null
  assignedAt: string
  assignedBy?: string | null
  serviceType: {
    id: string
    name: string
    slug: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Helper function to get authenticated headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    throw new Error('No active session found. Please sign in.')
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  }
}

// Create a new client
export async function createClient(clientData: ClientData): Promise<Client> {
  const supabase = createSupabaseClient()
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(clientData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create client')
  }

  const result = await response.json()
  return result.data
}

// Get all clients with optional filtering
export async function getClients(filters?: {
  status?: string
  serviceTypeId?: string
  serviceStatus?: string
  limit?: number
  offset?: number
}): Promise<Client[]> {
  const supabase = createSupabaseClient()
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  // Build query parameters
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.serviceTypeId) params.append('serviceTypeId', filters.serviceTypeId)
  if (filters?.serviceStatus) params.append('serviceStatus', filters.serviceStatus)
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.offset) params.append('offset', filters.offset.toString())

  const queryString = params.toString()
  const url = `/api/clients${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch clients')
  }

  const result = await response.json()
  return result.data.clients || []
}

// Get clients by service type
export async function getClientsByServiceType(serviceTypeId: string): Promise<Client[]> {
  const supabase = createSupabaseClient()
  
  // Get the current session
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
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch clients')
  }

  const result = await response.json()
  return result.data.clients || []
}

// Get a client by ID
export async function getClientById(id: string): Promise<Client | null> {
  const supabase = createSupabaseClient()
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`/api/clients/${id}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch client')
  }

  const result = await response.json()
  return result.data
}

// Update a client
export async function updateClient(id: string, clientData: Partial<ClientData>): Promise<Client> {
  const supabase = createSupabaseClient()
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(clientData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update client')
  }

  const result = await response.json()
  return result.data
}

// Delete a client
export async function deleteClient(id: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete client')
  }
}

export async function getClientCount(): Promise<number> {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/clients/count', {
      method: 'GET',
      headers,
    })

    const result: ApiResponse<{ count: number }> = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to fetch client count')
    }

    return result.data?.count || 0
  } catch (error) {
    console.error('Client count error:', error)
    return 0
  }
}

// Service Management Functions

// Add a service to a client
export async function addClientService(clientId: string, serviceTypeId: string): Promise<ClientAssignment> {
  const supabase = createSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`/api/clients/${clientId}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ serviceTypeId })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to add service')
  }

  const result = await response.json()
  return result.data
}

// Remove a service from a client
export async function removeClientService(clientId: string, serviceId: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`/api/clients/${clientId}/services/${serviceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to remove service')
  }
}

// Update service assignment status
export async function updateServiceStatus(
  clientId: string, 
  serviceId: string, 
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
): Promise<ClientAssignment> {
  const supabase = createSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`/api/clients/${clientId}/services/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ status })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update service status')
  }

  const result = await response.json()
  return result.data
}

// Get available service types
export async function getServiceTypes(): Promise<Array<{ id: string; name: string; slug: string }>> {
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
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch service types')
  }

  const result = await response.json()
  return result.data || []
} 