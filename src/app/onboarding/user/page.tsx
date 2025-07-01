'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSupabaseClient, getCurrentUser } from '@/lib/supabase'
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Camera,
  MapPin,
  Calendar,
  Clock,
  Award,
  Heart,
  Coffee,
  Palette
} from 'lucide-react'

export default function UserOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    phone: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    startDate: new Date().toISOString().split('T')[0],
    favoriteColor: '#228B22',
    workingHours: {
      start: '09:00',
      end: '17:00'
    }
  })
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  const supabase = createSupabaseClient()

  // Initialize user data
  useEffect(() => {
    const initUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/signin')
        return
      }
      setUser(currentUser)
      
      // Pre-fill form data from user metadata
      setFormData(prev => ({
        ...prev,
        firstName: currentUser.user_metadata?.firstName || '',
        lastName: currentUser.user_metadata?.lastName || '',
        title: currentUser.user_metadata?.title || '',
        phone: currentUser.user_metadata?.phone || ''
      }))
      
      // Fetch user's organization details
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const result = await response.json()
          const userData = result.data || result // Handle both wrapped and unwrapped responses
          setOrganization(userData.organization)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }
    initUser()
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests(prev => [...prev, newInterest.trim()])
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setInterests(prev => prev.filter(i => i !== interest))
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.title) {
        alert('Please fill in all required fields')
        return
      }
    }

    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    } else {
      await completeOnboarding()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const completeOnboarding = async () => {
    setIsLoading(true)

    try {
      const profileData = {
        ...formData,
        skills,
        interests
      }

      const response = await fetch('/api/users/complete-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        router.push('/dashboard?profile-complete=true')
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        alert(`Failed to complete profile: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Profile completion error:', error)
      alert('Failed to complete profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-blue-400/10" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to {organization.name}!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Let's complete your profile to get you started
          </p>
          <Badge variant="outline" className="mt-3">
            {user.user_metadata?.role?.replace('_', ' ') || 'Team Member'}
          </Badge>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                  ${currentStep >= step 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`
                    w-16 h-1 mx-3 rounded-full transition-all duration-300
                    ${currentStep > step ? 'bg-emerald-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <div className="text-sm font-medium text-gray-900">
              {currentStep === 1 && 'Basic Information'}
              {currentStep === 2 && 'Profile Details'}
              {currentStep === 3 && 'Skills & Preferences'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Step {currentStep} of 3
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl shadow-emerald-100/50 mb-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Basic Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Let's start with the essentials
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Senior Video Editor"
                    leftIcon={<Briefcase className="h-5 w-5 text-gray-400" />}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Profile Details */}
          {currentStep === 2 && (
            <>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Profile Details
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Tell us more about yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell your team a bit about yourself, your experience, and what you're excited to work on..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Preferred Working Hours
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                      <Input
                        type="time"
                        value={formData.workingHours.start}
                        onChange={(e) => handleInputChange('workingHours.start', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Time</label>
                      <Input
                        type="time"
                        value={formData.workingHours.end}
                        onChange={(e) => handleInputChange('workingHours.end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="inline h-4 w-4 mr-1" />
                    Favorite Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.favoriteColor}
                      onChange={(e) => handleInputChange('favoriteColor', e.target.value)}
                      className="w-16 h-10 p-1 border border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">
                      This will personalize your dashboard experience
                    </span>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Skills & Preferences */}
          {currentStep === 3 && (
            <>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Skills & Interests
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Help your team understand your expertise
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Award className="inline h-4 w-4 mr-1" />
                    Professional Skills
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="default" className="px-3 py-1 bg-gray-100 text-gray-800">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., Video Editing, Adobe Premiere)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button
                      type="button"
                      onClick={addSkill}
                      variant="outline"
                      disabled={!newSkill.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Heart className="inline h-4 w-4 mr-1" />
                    Interests & Hobbies
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="px-3 py-1">
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add an interest (e.g., Photography, Travel, Coffee)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    />
                    <Button
                      type="button"
                      onClick={addInterest}
                      variant="outline"
                      disabled={!newInterest.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Coffee className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-emerald-900">Almost Done!</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        Your profile helps the team collaborate better and creates a more personal workspace experience.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentStep === 1 || isLoading}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <span>
              {currentStep === 3 ? (isLoading ? 'Completing...' : 'Complete Profile') : 'Next'}
            </span>
            {currentStep < 3 && <ArrowRight className="h-4 w-4" />}
            {currentStep === 3 && <CheckCircle className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
} 