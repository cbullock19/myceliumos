'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase'
import { generateOrganizationSlug } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Building, User, Mail, Lock, AlertCircle, CheckCircle, Loader2, MailOpen, Clock, ArrowRight } from 'lucide-react'

const signupSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [userEmail, setUserEmail] = useState('')
  const supabase = createSupabaseClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    getValues
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  })

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Smart polling function
  const startEmailConfirmationPolling = (email: string) => {
    setUserEmail(email)
    setWaitingForConfirmation(true)
    setPollingAttempts(0)

    // Initial check after 2 seconds
    const initialCheck = setTimeout(async () => {
      await checkEmailConfirmation(email)
    }, 2000)

    // Start polling with exponential backoff
    const interval = setInterval(async () => {
      const attempts = pollingAttempts + 1
      setPollingAttempts(attempts)

      // Exponential backoff: 3s, 5s, 8s, 12s, 15s, then 15s intervals
      const backoffDelays = [3000, 5000, 8000, 12000, 15000]
      const delay = attempts <= backoffDelays.length ? backoffDelays[attempts - 1] : 15000

      // Stop polling after 5 minutes (20 attempts)
      if (attempts >= 20) {
        clearInterval(interval)
        setPollingInterval(null)
        console.log('Polling stopped after 5 minutes')
        return
      }

      await checkEmailConfirmation(email)
    }, 3000) // Start with 3-second intervals

    setPollingInterval(interval)
  }

  const checkEmailConfirmation = async (email: string) => {
    try {
      console.log(`🔍 Checking email confirmation (attempt ${pollingAttempts + 1})...`)

      // Check if user exists and is confirmed
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.log('No authenticated user found, continuing to poll...')
        return
      }

      if (user && user.email === email && user.email_confirmed_at) {
        console.log('✅ Email confirmed! Redirecting to onboarding...')
        
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }

        // For new user registrations, always redirect to onboarding
        // The auth callback should have created the organization and user
        // but we want to ensure they go through the onboarding flow
        router.push('/onboarding')
      } else {
        console.log('Email not yet confirmed, continuing to poll...')
      }
    } catch (error) {
      console.error('Error checking email confirmation:', error)
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)

    try {
      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            companyName: data.companyName,
            organizationSlug: generateOrganizationSlug(data.companyName)
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('email', { message: 'This email is already registered' })
        } else {
          setError('root', { message: authError.message })
        }
        return
      }

      if (authData.user) {
        console.log('Signup successful:', authData.user)
        console.log('User confirmed:', authData.user.email_confirmed_at)
        console.log('Session:', authData.session)
        
        // Check if we have a session (user is authenticated)
        if (authData.session) {
          // User is authenticated, redirect to onboarding
          // This handles cases where email confirmation is not required
          router.push('/onboarding')
        } else {
          // No session - email confirmation required
          startEmailConfirmationPolling(data.email)
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })

      if (error) {
        console.error('Resend error:', error)
      } else {
        console.log('Resend email sent successfully')
      }
    } catch (error) {
      console.error('Resend error:', error)
    }
  }

  const handleManualCheck = async () => {
    if (userEmail) {
      await checkEmailConfirmation(userEmail)
    }
  }

  // Email confirmation waiting screen
  if (waitingForConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <MailOpen className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              We've sent a confirmation link to <strong>{userEmail}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-600">
                Waiting for confirmation... (attempt {pollingAttempts + 1})
              </span>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens next:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Click the confirmation link in your email</li>
                    <li>• We'll automatically detect the confirmation</li>
                    <li>• You'll be redirected to complete your setup</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleManualCheck}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                I've confirmed my email
              </Button>
              
              <Button
                onClick={handleResendEmail}
                variant="ghost"
                className="w-full text-sm"
                disabled={isLoading}
              >
                <Mail className="h-4 w-4 mr-2" />
                Resend confirmation email
              </Button>
            </div>

            {/* Troubleshooting */}
            <div className="text-xs text-gray-500 text-center">
              <p>Don't see the email? Check your spam folder.</p>
              <p>You can close the confirmation tab once you click the link.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Building className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Your Agency
          </CardTitle>
          <CardDescription className="text-gray-600">
            Set up your Mycelium OS account in minutes
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Your Agency Name"
                  className="pl-10"
                  {...register('companyName')}
                />
              </div>
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.companyName.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Full Name"
                  className="pl-10"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Root Error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {errors.root.message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>

            {/* Success Message */}
            {isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {successMessage}
                </p>
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 