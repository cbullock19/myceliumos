'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { createSupabaseClient } from '@/lib/supabase'
import { 
  Users, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  Clock,
  UserCheck,
  UserX,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: string
  title?: string
  avatarUrl?: string
  lastLoginAt?: string
  emailVerified: boolean
  assignedClientsCount: number
  invitedAt?: string
  invitedBy?: string
}

interface InviteUserData {
  email: string
  role: string
  // Enhanced user profile fields
  firstName: string
  lastName: string
  title: string
  phone?: string
  customPermissions?: {
    serviceTypes: string[]
    clientAccess: string
    permissions: string[]
  }
}

export default function TeamPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null)
  const [inviteData, setInviteData] = useState<InviteUserData>({
    email: '',
    role: 'VIDEO_EDITOR',
    firstName: '',
    lastName: '',
    title: '',
    phone: ''
  })
  const [isInviting, setIsInviting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null)
  const supabase = createSupabaseClient()

  const roleDisplayNames = {
    'ADMIN': 'Admin',
    'VIDEO_EDITOR': 'Video Editor',
    'SEO_STRATEGIST': 'SEO Strategist',
    'WEBSITE_DESIGNER': 'Website Designer',
    'FILMER': 'Filmer',
    'CUSTOM': 'Custom Role'
  }

  const roleColors = {
    'ADMIN': 'bg-red-100 text-red-800',
    'VIDEO_EDITOR': 'bg-purple-100 text-purple-800',
    'SEO_STRATEGIST': 'bg-blue-100 text-blue-800',
    'WEBSITE_DESIGNER': 'bg-green-100 text-green-800',
    'FILMER': 'bg-orange-100 text-orange-800',
    'CUSTOM': 'bg-gray-100 text-gray-800'
  }

  const statusColors = {
    'ACTIVE': 'bg-green-100 text-green-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'INACTIVE': 'bg-gray-100 text-gray-800',
    'SUSPENDED': 'bg-red-100 text-red-800'
  }

  useEffect(() => {
    loadCurrentUser()
    loadTeamMembers()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [teamMembers, searchQuery, filterRole, filterStatus])

  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        // Get user role from API (same endpoint that provides team data)
        const response = await fetch('/api/users/team')
        if (response.ok) {
          const data = await response.json()
          // Find current user in the team data to get their role
          const currentUserData = data.users?.find((u: TeamMember) => u.id === user.id)
          if (currentUserData) {
            setCurrentUser({ id: user.id, role: currentUserData.role })
          }
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/users/team')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.users || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to load team members:', errorData)
        
        // Don't redirect on auth errors - let the dashboard layout handle authentication
        // Just log the error and show empty state
        
        // Show user-friendly error message
        console.warn(`Team API Error: ${errorData.error || 'Unknown error'}`)
        
        // Set empty team members array to show the UI instead of failing
        setTeamMembers([])
        
        // Show a toast or set an error state instead of alert
        // alert(`Error: ${errorData.error || 'Failed to load team members. Please try again.'}`)
      }
    } catch (error) {
      console.error('Error loading team members:', error)
      // Set empty team members array to show empty state gracefully
      setTeamMembers([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = teamMembers

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.role === filterRole)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus)
    }

    setFilteredMembers(filtered)
  }

  const handleInviteUser = async () => {
    // Validate required fields
    if (!inviteData.email || !inviteData.firstName || !inviteData.lastName || !inviteData.title) {
      alert('Please fill in all required fields (First Name, Last Name, Email, and Job Title)')
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData)
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Add pending user to list immediately
        const newMember: TeamMember = {
          id: result.user.id,
          name: result.user.name || inviteData.email.split('@')[0],
          email: inviteData.email,
          role: inviteData.role,
          status: 'PENDING',
          emailVerified: false,
          assignedClientsCount: 0,
          invitedAt: new Date().toISOString()
        }
        setTeamMembers(prev => [...prev, newMember])
        setShowInviteModal(false)
        setInviteData({ 
          email: '', 
          role: 'VIDEO_EDITOR',
          firstName: '',
          lastName: '',
          title: '',
          phone: ''
        })
        
        // Handle different response types
        if (result.emailDelivered === false) {
          // Email delivery failed - show fallback information
          const fallbackInfo = `
🎉 USER CREATED SUCCESSFULLY!

⚠️ Email Issue: ${result.emailError}

📧 Since the invitation email couldn't be delivered, please share these login credentials with ${inviteData.email} manually:

Email: ${result.loginInstructions.email}
Temporary Password: ${result.loginInstructions.temporaryPassword}
Login URL: ${result.loginInstructions.loginUrl}

Note: ${result.loginInstructions.note}
          `.trim()
          
          // Use a better modal or notification system in production
          if (window.confirm(`${result.message}\n\n${result.fallbackMessage}\n\nClick OK to see the login credentials that you'll need to share manually.`)) {
            alert(fallbackInfo)
          }
        } else {
          // Email sent successfully
          alert(`✅ ${result.message}`)
        }
      } else {
        const error = await response.json()
        const errorMessage = error.details 
          ? `${error.error}\n\nDetails: ${error.details}\n\nResolution: ${error.resolution || 'Please try again'}`
          : error.message || error.error || 'Unknown error occurred'
        
        alert(`❌ Failed to create user invitation:\n\n${errorMessage}`)
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Failed to send invitation. Please try again.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedMembers.length === 0) return

    switch (action) {
      case 'deactivate':
        // Implement bulk deactivation
        console.log('Deactivating users:', selectedMembers)
        break
      case 'resend':
        // Implement bulk resend invitations
        console.log('Resending invitations:', selectedMembers)
        break
    }
  }

  const handleDeleteUser = async (member: TeamMember) => {
    // Admin-only permission check
    if (!currentUser || currentUser.role !== 'ADMIN') {
      alert('❌ Only administrators can delete team members.')
      return
    }

    // Cannot delete self
    if (member.id === currentUser.id) {
      alert('❌ You cannot delete your own account.')
      return
    }

    // Check if this is the only admin
    if (member.role === 'ADMIN') {
      const adminCount = teamMembers.filter(m => m.role === 'ADMIN' && (m.status === 'ACTIVE' || m.status === 'PENDING')).length
      if (adminCount <= 1) {
        alert('❌ Cannot delete the only administrator.\n\nPromote another user to admin first, then retry deletion.')
        return
      }
    }

    // Set member for deletion and show confirmation modal
    setMemberToDelete(member)
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!memberToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${memberToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        
        // Remove user from team list
        setTeamMembers(prev => prev.filter(m => m.id !== memberToDelete.id))
        setShowDeleteModal(false)
        setMemberToDelete(null)
        
        // Show success message with impact details
        const impactMessage = result.impact.reassignedDeliverables > 0 || result.impact.updatedClientAssignments > 0
          ? `\n\n📊 Impact:\n• ${result.impact.reassignedDeliverables} deliverables reassigned to ${result.impact.reassignedTo}\n• ${result.impact.updatedClientAssignments} client assignments updated`
          : '\n\n📊 No active assignments were affected.'
        
        alert(`✅ ${result.message}${impactMessage}`)
      } else {
        const error = await response.json()
        const errorMessage = error.details 
          ? `${error.error}\n\nDetails: ${error.details}\n\nResolution: ${error.resolution || 'Please try again'}`
          : error.message || error.error || 'Unknown error occurred'
        
        alert(`❌ Failed to delete user:\n\n${errorMessage}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('❌ Failed to delete user. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper function to check if current user can delete a specific member
  const canDeleteUser = (member: TeamMember) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return false
    if (member.id === currentUser.id) return false // Cannot delete self
    
    // If deleting an admin, ensure there's at least one other admin
    if (member.role === 'ADMIN') {
      const adminCount = teamMembers.filter(m => m.role === 'ADMIN' && (m.status === 'ACTIVE' || m.status === 'PENDING')).length
      return adminCount > 1
    }
    
    return true
  }

  const formatLastLogin = (lastLoginAt?: string) => {
    if (!lastLoginAt) return 'Never'
    const date = new Date(lastLoginAt)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600">
              Manage your team members, roles, and permissions.
            </p>
          </div>
          {/* Admin-only Invite button */}
          {currentUser?.role === 'ADMIN' && (
            <Button 
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite Team Member
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="VIDEO_EDITOR">Video Editor</option>
                <option value="SEO_STRATEGIST">SEO Strategist</option>
                <option value="WEBSITE_DESIGNER">Website Designer</option>
                <option value="FILMER">Filmer</option>
                <option value="CUSTOM">Custom Role</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedMembers.length > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-md">
              <span className="text-sm text-blue-700">
                {selectedMembers.length} member(s) selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
              >
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('resend')}
              >
                Resend Invitations
              </Button>
            </div>
          )}
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers(prev => [...prev, member.id])
                        } else {
                          setSelectedMembers(prev => prev.filter(id => id !== member.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Avatar className="h-10 w-10 bg-brand text-white">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={roleColors[member.role as keyof typeof roleColors]}>
                      {roleDisplayNames[member.role as keyof typeof roleDisplayNames]}
                    </Badge>
                    <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                      {member.status}
                    </Badge>
                  </div>
                  
                  {member.title && (
                    <p className="text-sm text-gray-600">{member.title}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastLogin(member.lastLoginAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {member.assignedClientsCount} clients
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedMember(member)
                        setShowProfileModal(true)
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {/* Admin-only Delete button */}
                    {canDeleteUser(member) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleDeleteUser(member)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by inviting your first team member.'}
            </p>
            {(!searchQuery && filterRole === 'all' && filterStatus === 'all') && currentUser?.role === 'ADMIN' && (
              <Button onClick={() => setShowInviteModal(true)}>
                Invite Team Member
              </Button>
            )}
          </div>
        )}

        {/* Invite User Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Team Member"
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="John"
                    value={inviteData.firstName}
                    onChange={(e) => setInviteData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Smith"
                    value={inviteData.lastName}
                    onChange={(e) => setInviteData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="john.smith@company.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <Input
                    type="text"
                    placeholder="Senior Video Editor"
                    value={inviteData.title}
                    onChange={(e) => setInviteData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={inviteData.phone}
                    onChange={(e) => setInviteData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Role & Permissions
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="ADMIN">Admin - Full platform access</option>
                  <option value="VIDEO_EDITOR">Video Editor - Social media deliverables only</option>
                  <option value="SEO_STRATEGIST">SEO Strategist - SEO deliverables only</option>
                  <option value="WEBSITE_DESIGNER">Website Designer - Website projects only</option>
                  <option value="FILMER">Filmer - Video content creation</option>
                  <option value="CUSTOM">Custom Role - Configure specific permissions</option>
                </select>
              </div>
            </div>

            {inviteData.role === 'CUSTOM' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900">Custom Role Configuration</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type Access
                  </label>
                  <div className="space-y-2">
                    {['Social Media', 'SEO', 'Website Design', 'Video Production'].map((service) => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 mr-2"
                        />
                        <span className="text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Access Level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="assigned">Assigned clients only</option>
                    <option value="all">All clients</option>
                    <option value="specific">Specific clients</option>
                  </select>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Team member will receive a branded invitation email
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    They'll get login credentials and a link to set up their account.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteUser}
                disabled={!inviteData.email || !inviteData.firstName || !inviteData.lastName || !inviteData.title || isInviting}
                className="flex-1"
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Team Member"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-md">
              <div className="flex-shrink-0">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-red-900">
                  Are you sure you want to delete {memberToDelete?.name}?
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  This will permanently remove their access and cannot be undone.
                </p>
              </div>
            </div>

            {memberToDelete && (
              <div className="space-y-3">
                <div className="bg-yellow-50 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        Impact Analysis
                      </p>
                      <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                        <li>• User account will be deleted from both database and authentication system</li>
                        <li>• Any active deliverables will be reassigned to you</li>
                        <li>• Client assignments will be removed</li>
                        <li>• All user data will be permanently deleted</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">User Role:</span>
                    <Badge className={roleColors[memberToDelete.role as keyof typeof roleColors]}>
                      {roleDisplayNames[memberToDelete.role as keyof typeof roleDisplayNames]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Assigned Clients:</span>
                    <span className="font-medium">{memberToDelete.assignedClientsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-mono text-xs">{memberToDelete.email}</span>
                  </div>
                </div>

                {memberToDelete.role === 'ADMIN' && (
                  <div className="bg-red-50 p-3 rounded-md border border-red-200">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          ⚠️ Admin Deletion Warning
                        </p>
                        <p className="text-sm text-red-800 mt-1">
                          You are about to delete another administrator. Make sure there are other admins to manage the organization.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setMemberToDelete(null)
                }}
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
} 