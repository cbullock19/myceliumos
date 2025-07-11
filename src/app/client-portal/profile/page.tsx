'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  Key,
  Bell,
  Eye,
  EyeOff,
  Save,
  Edit,
  Camera
} from 'lucide-react'

// Types
interface ProfileData {
  user: {
    id: string
    name: string
    email: string
    title?: string
    phone?: string
    role: string
    lastLoginAt: string
    createdAt: string
  }
  organization: {
    name: string
    contactEmail: string
    supportPhone?: string
  }
  permissions: {
    canApprove: boolean
    canDownload: boolean
    canComment: boolean
  }
  activity: {
    totalLogins: number
    lastActivity: string
    recentProjects: number
  }
}

export default function ClientPortalProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: ''
  })

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/client-portal/profile')
        // const data = await response.json()
        // setProfileData(data.data)

        // Mock data for now
        setProfileData({
          user: {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@company.com',
            title: 'Marketing Director',
            phone: '+1 (555) 123-4567',
            role: 'PRIMARY',
            lastLoginAt: '2024-01-15T10:30:00Z',
            createdAt: '2023-12-01T09:00:00Z'
          },
          organization: {
            name: 'Acme Corporation',
            contactEmail: 'support@acme.com',
            supportPhone: '+1 (555) 987-6543'
          },
          permissions: {
            canApprove: true,
            canDownload: true,
            canComment: true
          },
          activity: {
            totalLogins: 47,
            lastActivity: '2024-01-15T14:22:00Z',
            recentProjects: 3
          }
        })
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileData()
  }, [])

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.user.name,
        email: profileData.user.email,
        phone: profileData.user.phone || '',
        title: profileData.user.title || ''
      })
    }
  }, [profileData])

  const getRoleBadge = (role: string) => {
    const variants = {
      'PRIMARY': { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Primary Contact' },
      'VIEWER': { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Viewer' },
      'ADMIN': { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Admin' }
    }
    
    const variant = variants[role as keyof typeof variants] || variants.VIEWER
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variant.color}`}>
        {variant.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSave = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/client-portal/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      
      console.log('Profile updated:', formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load profile</h2>
        <p className="text-gray-600">Please try refreshing the page or contact your project team.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Profile
        </h1>
        <p className="text-gray-600">
          Manage your account settings, contact information, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.user.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.user.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.user.title || 'Not specified'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.user.phone || 'Not specified'}</p>
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Password</h3>
                    <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-1" />
                    Change Password
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity & Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Activity & Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{profileData.activity.totalLogins}</p>
                  <p className="text-sm text-gray-600">Total Logins</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{profileData.activity.recentProjects}</p>
                  <p className="text-sm text-gray-600">Active Projects</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{profileData.permissions.canApprove ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-600">Can Approve</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Last login: {formatDate(profileData.user.lastLoginAt)}</p>
                  <p>Account created: {formatDate(profileData.user.createdAt)}</p>
                  <p>Last activity: {formatDate(profileData.activity.lastActivity)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-emerald-600">
                    {profileData.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{profileData.user.name}</h3>
                <p className="text-sm text-gray-600">{profileData.user.title}</p>
                {getRoleBadge(profileData.user.role)}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{profileData.user.email}</span>
                </div>
                {profileData.user.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{profileData.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{profileData.organization.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Can Approve Deliverables</span>
                  <Badge variant={profileData.permissions.canApprove ? 'default' : 'outline'}>
                    {profileData.permissions.canApprove ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Can Download Files</span>
                  <Badge variant={profileData.permissions.canDownload ? 'default' : 'outline'}>
                    {profileData.permissions.canDownload ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Can Add Comments</span>
                  <Badge variant={profileData.permissions.canComment ? 'default' : 'outline'}>
                    {profileData.permissions.canComment ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Support Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Project Team</p>
                  <p className="text-sm text-gray-600">{profileData.organization.contactEmail}</p>
                </div>
                {profileData.organization.supportPhone && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Support Phone</p>
                    <p className="text-sm text-gray-600">{profileData.organization.supportPhone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">More Features Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            We're working on adding profile picture uploads, notification preferences, and advanced security settings.
          </p>
          <p className="text-sm text-gray-500">
            Contact your project team for additional account customization options.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 