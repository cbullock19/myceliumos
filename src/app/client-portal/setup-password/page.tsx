'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, User } from 'lucide-react'
import { toast } from 'sonner'

const invitationSetupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type InvitationSetupFormData = z.infer<typeof invitationSetupSchema>
type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>

interface InvitationData {
  email: string
  name: string
  role: string
  clientName: string
  organizationName: string
}

// Separate component that uses useSearchParams
function SetupPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isTokenExpired, setIsTokenExpired] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      validateInvitationToken()
    }
  }, [token])

  const validateInvitationToken = async () => {
    setIsValidating(true)
    setValidationError(null)
    
    try {
      console.log('🔍 Validating invitation token...')
      
      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/client-auth/validate-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('📡 Token validation response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Token validation failed:', errorData)
        
        if (errorData.error === 'TOKEN_EXPIRED') {
          setIsTokenExpired(true)
        } else {
          setValidationError(errorData.error || 'Failed to validate invitation')
        }
        return
      }
      
      const result = await response.json()
      console.log('✅ Token validation successful:', result.data)
      
      setInvitationData(result.data)
      setIsValidToken(true)
      
    } catch (error) {
      console.error('❌ Token validation error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setValidationError('Request timed out. Please try again or contact support.')
        } else {
          setValidationError('Network error. Please check your connection and try again.')
        }
      } else {
        setValidationError('Something went wrong validating your invitation. Please request a new invite or contact support.')
      }
    } finally {
      setIsValidating(false)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<InvitationSetupFormData>({
    resolver: zodResolver(invitationSetupSchema),
    defaultValues: {
      name: invitationData?.name || ''
    }
  })

  const password = watch('password')

  const onSubmit = async (data: InvitationSetupFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/client-auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          name: data.name,
          password: data.password
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'INVALID_TOKEN') {
          setError('root', { message: 'Invalid or expired invitation link' })
        } else if (result.error === 'PASSWORD_TOO_WEAK') {
          setError('password', { message: 'Password does not meet security requirements' })
        } else {
          setError('root', { message: result.error || 'An unexpected error occurred' })
        }
        return
      }

      // Success - redirect to dashboard
      toast.success('Account setup complete! Welcome to your client portal.')
      router.push('/client-portal/dashboard')
    } catch (error) {
      console.error('Account setup error:', error)
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isTokenExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Invitation Expired
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                This invitation link has expired. Please contact your project team for a new invitation.
              </p>
              <Button 
                onClick={() => router.push('/client-portal/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader className="text-center">
              {isValidating ? (
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : validationError ? (
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              ) : (
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-gray-600" />
                </div>
              )}
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isValidating ? 'Validating Invitation' : validationError ? 'Validation Failed' : 'Validating Invitation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {isValidating ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Please wait while we validate your invitation...
                  </p>
                  <div className="text-sm text-gray-500">
                    This may take a few seconds
                  </div>
                </div>
              ) : validationError ? (
                <div>
                  <p className="text-red-600 mb-4">
                    {validationError}
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        setValidationError(null)
                        validateInvitationToken()
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Try Again
                    </Button>
                    <Button 
                      onClick={() => router.push('/client-portal/login')}
                      className="w-full"
                    >
                      Go to Login
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  Please wait while we validate your invitation...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-32 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {invitationData?.organizationName || 'Client Portal'}
            </span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Set Up Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to {invitationData?.clientName}! Please complete your account setup.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
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
                    placeholder="Enter your full name"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Create a secure password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Error Message */}
              {errors.root && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.root.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Setting up account...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function ClientPortalSetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-32 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                Client Portal
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Set Your Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Loading...
            </p>
          </div>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="bg-white shadow-xl">
            <CardContent className="px-8 py-8">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <SetupPasswordForm />
    </Suspense>
  )
} 