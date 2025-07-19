'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSupabaseClient, getCurrentUser } from '@/lib/supabase'
import { markOnboardingComplete } from '@/lib/onboarding'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Building, 
  Users, 
  Palette, 
  Mail, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Globe,
  Briefcase,
  Hash,
  Plus,
  X,
  Upload,
  Eye,
  Monitor,
  Smartphone
} from 'lucide-react'
import { SERVICE_TEMPLATES } from '@/lib/service-templates'

// Service type templates imported from @/lib/service-templates


// Form schemas for each step
const basicInfoSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  website: z.string().optional().or(z.literal('')).refine((val) => {
    if (!val || val === '') return true // Optional field
    // Allow URLs with or without protocol
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    return urlPattern.test(val)
  }, 'Please enter a valid URL'),
  industry: z.string().min(1, 'Please select an industry'),
  teamSize: z.string().min(1, 'Please select team size')
})

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color'),
  logoUrl: z.string().optional()
})

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>(['social-media'])
  const [customService, setCustomService] = useState('')
  const [showCustomServiceForm, setShowCustomServiceForm] = useState(false)
  const [serviceFields, setServiceFields] = useState<Record<string, any>>({})
  const [previewTheme, setPreviewTheme] = useState('#228B22')
  const [teamInvites, setTeamInvites] = useState([{ email: '', role: 'VIDEO_EDITOR' }])

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
    }
    initUser()
  }, [router])

  // Step 1: Basic Information
  const basicInfoForm = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      organizationName: '',
      website: '',
      industry: '',
      teamSize: ''
    }
  })

  // Step 4: Branding
  const brandingForm = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: '#228B22',
      logoUrl: ''
    }
  })

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const addCustomService = () => {
    if (customService.trim()) {
      const customId = `custom-${Date.now()}`
      setSelectedServices(prev => [...prev, customId])
      setServiceFields(prev => ({
        ...prev,
        [customId]: {
          name: customService,
          description: 'Custom service',
          defaultFields: [
            { name: 'Due Date', type: 'date', required: true },
            { name: 'Description', type: 'text', required: false },
            { name: 'Files', type: 'url', required: false }
          ]
        }
      }))
      setCustomService('')
      setShowCustomServiceForm(false)
    }
  }

  const addTeamInvite = () => {
    setTeamInvites(prev => [...prev, { email: '', role: 'VIDEO_EDITOR' }])
  }

  const removeTeamInvite = (index: number) => {
    setTeamInvites(prev => prev.filter((_, i) => i !== index))
  }

  const updateTeamInvite = (index: number, field: string, value: string) => {
    setTeamInvites(prev => prev.map((invite, i) => 
      i === index ? { ...invite, [field]: value } : invite
    ))
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await basicInfoForm.trigger()
      if (!isValid) return
    } else if (currentStep === 4) {
      const isValid = await brandingForm.trigger()
      if (!isValid) return
    }

    if (currentStep < 5) {
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
      // Prepare onboarding data
      const basicInfo = basicInfoForm.getValues()
      const branding = brandingForm.getValues()

      const onboardingData = {
        basicInfo,
        selectedServices: selectedServices.map(serviceId => {
          const template = SERVICE_TEMPLATES.find(s => s.id === serviceId)
          return template || serviceFields[serviceId]
        }),
        branding,
        teamInvites: teamInvites.filter(invite => invite.email && invite.role)
      }

      // Submit to API
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(onboardingData)
      })

      if (response.ok) {
        // Update Supabase metadata to mark onboarding as complete
        try {
          await markOnboardingComplete()
          console.log('✅ Onboarding metadata updated successfully')
        } catch (metadataError) {
          console.error('⚠️ Failed to update metadata, but onboarding completed:', metadataError)
          // Don't fail the onboarding completion for metadata errors
        }
        
        router.push('/dashboard?welcome=true')
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(`Failed to complete onboarding: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      // Show error message
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Mycelium OS, {user.user_metadata?.name}!</h1>
          <p className="mt-2 text-lg text-gray-600">Let's set up your agency in 5 quick steps</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step 
                    ? 'bg-brand text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step}
                </div>
                {step < 5 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${currentStep > step ? 'bg-brand' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            Step {currentStep} of 5
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Tell us about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="space-y-4">
                  <Input
                    {...basicInfoForm.register('organizationName')}
                    label="Organization Name"
                    placeholder="Acme Creative Agency"
                    error={basicInfoForm.formState.errors.organizationName?.message}
                  />

                  <Input
                    {...basicInfoForm.register('website')}
                    label="Website URL (Optional)"
                    placeholder="https://acmecreative.com"
                    leftIcon={<Globe className="h-4 w-4 text-gray-400" />}
                    error={basicInfoForm.formState.errors.website?.message}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Industry</label>
                    <select 
                      {...basicInfoForm.register('industry')}
                      className="input-base"
                    >
                      <option value="">Select an industry</option>
                      <option value="creative-agency">Creative Agency</option>
                      <option value="digital-marketing">Digital Marketing</option>
                      <option value="social-media">Social Media Management</option>
                      <option value="web-design">Web Design/Development</option>
                      <option value="video-production">Video Production</option>
                      <option value="other">Other</option>
                    </select>
                    {basicInfoForm.formState.errors.industry && (
                      <p className="text-xs text-error-600">{basicInfoForm.formState.errors.industry.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Team Size</label>
                    <select 
                      {...basicInfoForm.register('teamSize')}
                      className="input-base"
                    >
                      <option value="">Select team size</option>
                      <option value="just-me">Just me</option>
                      <option value="2-5">2-5 people</option>
                      <option value="6-15">6-15 people</option>
                      <option value="16-50">16-50 people</option>
                      <option value="50+">50+ people</option>
                    </select>
                    {basicInfoForm.formState.errors.teamSize && (
                      <p className="text-xs text-error-600">{basicInfoForm.formState.errors.teamSize.message}</p>
                    )}
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 2: Service Types */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Service Types Setup
                </CardTitle>
                <CardDescription>
                  What services does your agency offer?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SERVICE_TEMPLATES.map((service) => (
                    <div
                      key={service.id}
                      className={`
                        border rounded-lg p-4 cursor-pointer transition-all
                        ${selectedServices.includes(service.id)
                          ? 'border-brand bg-brand bg-opacity-5'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        </div>
                        {selectedServices.includes(service.id) && (
                          <CheckCircle className="h-5 w-5 text-brand ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Service */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Custom Service</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomServiceForm(true)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Custom
                    </Button>
                  </div>

                  {showCustomServiceForm && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Service name"
                        value={customService}
                        onChange={(e) => setCustomService(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={addCustomService} size="sm">Add</Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowCustomServiceForm(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Deliverable Templates */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hash className="mr-2 h-5 w-5" />
                  Deliverable Templates
                </CardTitle>
                <CardDescription>
                  Configure deliverable fields for each service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {selectedServices.map((serviceId) => {
                    const service = SERVICE_TEMPLATES.find(s => s.id === serviceId) || serviceFields[serviceId]
                    if (!service) return null

                    return (
                      <div key={serviceId} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">{service.name}</h3>
                        <div className="space-y-2">
                          {service.defaultFields.map((field: any, index: number) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700">{field.name}</span>
                                {field.required && (
                                  <Badge variant="error" size="sm" className="ml-2">Required</Badge>
                                )}
                              </div>
                              <Badge variant="outline" size="sm">{field.type}</Badge>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-xs text-gray-600">
                            Preview: Deliverables for {service.name} will include these fields
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Branding Setup */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Branding Setup
                </CardTitle>
                <CardDescription>
                  Make Mycelium OS match your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                      <div className="flex gap-2">
                        <input
                          {...brandingForm.register('primaryColor')}
                          type="color"
                          className="w-12 h-10 border border-gray-300 rounded-md"
                          onChange={(e) => setPreviewTheme(e.target.value)}
                        />
                        <Input
                          {...brandingForm.register('primaryColor')}
                          placeholder="#228B22"
                          className="flex-1"
                          onChange={(e) => setPreviewTheme(e.target.value)}
                        />
                      </div>
                      {brandingForm.formState.errors.primaryColor && (
                        <p className="text-xs text-error-600">{brandingForm.formState.errors.primaryColor.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Logo Upload</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Drag & drop your logo here, or{' '}
                          <button className="text-brand hover:text-brand-hover font-medium">
                            browse files
                          </button>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </h3>
                    
                    {/* Dashboard Preview */}
                    <div 
                      className="border rounded-lg p-4 bg-white"
                      style={{ '--color-brand': previewTheme } as React.CSSProperties}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Dashboard Preview</h4>
                        <Monitor className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-100 rounded"></div>
                        <div className="flex gap-2">
                          <div 
                            className="h-8 rounded px-3 flex items-center text-white text-xs font-medium"
                            style={{ backgroundColor: previewTheme }}
                          >
                            Primary Button
                          </div>
                          <div className="h-8 bg-gray-100 rounded px-3 flex items-center text-xs">Secondary</div>
                        </div>
                      </div>
                    </div>

                    {/* Client Portal Preview */}
                    <div 
                      className="border rounded-lg p-4 bg-white"
                      style={{ '--color-brand': previewTheme } as React.CSSProperties}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Client Portal Preview</h4>
                        <Smartphone className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <div 
                          className="h-2 rounded"
                          style={{ backgroundColor: previewTheme }}
                        ></div>
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    </div>

                    {/* Email Preview */}
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Email Template Preview</h4>
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <div 
                          className="h-1 rounded w-full"
                          style={{ backgroundColor: previewTheme }}
                        ></div>
                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                        <div 
                          className="h-1 rounded w-full mt-2"
                          style={{ backgroundColor: previewTheme }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 5: Team Invitations */}
          {currentStep === 5 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Team Invitations
                </CardTitle>
                <CardDescription>
                  Invite your team members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {teamInvites.map((invite, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="team@email.com"
                        value={invite.email}
                        onChange={(e) => updateTeamInvite(index, 'email', e.target.value)}
                        className="flex-1"
                      />
                      <select
                        value={invite.role}
                        onChange={(e) => updateTeamInvite(index, 'role', e.target.value)}
                        className="input-base w-40"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="VIDEO_EDITOR">Video Editor</option>
                        <option value="SEO_STRATEGIST">SEO Strategist</option>
                        <option value="WEBSITE_DESIGNER">Website Designer</option>
                        <option value="FILMER">Filmer</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                      {teamInvites.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamInvite(index)}
                          className="h-10 w-10 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addTeamInvite}
                  leftIcon={<Plus className="h-4 w-4" />}
                  disabled={teamInvites.length >= 10}
                >
                  Add Another
                </Button>

                <div className="bg-info-50 border border-info-200 rounded-md p-4">
                  <div className="flex">
                    <Mail className="h-5 w-5 text-info-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-info-800">
                        Team members will receive branded invite emails
                      </h3>
                      <p className="text-sm text-info-700 mt-1">
                        They'll get login credentials and be guided through account setup
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleNext}
                    loading={isLoading}
                    fullWidth
                    className="mt-4"
                  >
                    Send Invitations & Complete Setup
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={handleNext}
                    fullWidth
                    className="text-sm"
                  >
                    Skip for Now
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
            )}
          </div>

          <div>
            {currentStep < 5 && (
              <Button
                onClick={handleNext}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 