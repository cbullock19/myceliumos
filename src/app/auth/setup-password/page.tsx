'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, User } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'

const passwordSetupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  temporaryPassword: z.string().min(1, 'Temporary password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type PasswordSetupFormData = z.infer<typeof passwordSetupSchema>

// Loading fallback component
function SetupPasswordLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl shadow-emerald-100/50">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main password setup component that uses useSearchParams
function PasswordSetupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError
  } = useForm<PasswordSetupFormData>({
    resolver: zodResolver(passwordSetupSchema)
  })

  const newPassword = watch('newPassword')

  useEffect(() => {
    // Pre-fill email from URL parameter if available
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      setValue('email', emailParam)
    }
  }, [searchParams, setValue])

  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ]
    strength = checks.filter(Boolean).length
    return strength
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500'
    if (strength < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength < 2) return 'Weak'
    if (strength < 4) return 'Medium'
    return 'Strong'
  }

  const onSubmit = async (data: PasswordSetupFormData) => {
    setIsLoading(true)

    try {
      // First, activate the account
      const response = await fetch('/api/users/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          temporaryPassword: data.temporaryPassword,
          newPassword: data.newPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError('root', { message: result.error || 'Failed to set up account' })
        return
      }

      // Now sign in with the new password to establish a proper session
      const supabase = createSupabaseClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.newPassword
      })

      if (authError) {
        console.error('Sign in error after password setup:', authError)
        setError('root', { message: 'Account activated but sign-in failed. Please try signing in manually.' })
        return
      }

      setIsSuccess(true)
      
      // Redirect to user onboarding after establishing session
      setTimeout(() => {
        window.location.href = '/onboarding/user'
      }, 1000)

    } catch (error) {
      console.error('Password setup error:', error)
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl shadow-emerald-100/50">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Set Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Great! Now let's complete your profile to get you started with your team.
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-blue-400/10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-300/20 to-transparent rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-300/20 to-transparent rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
      
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 bg-clip-text text-transparent">
            Mycelium OS
          </h1>
          <p className="mt-3 text-lg text-gray-600 font-medium">Complete Your Account Setup</p>
        </div>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl shadow-emerald-100/50">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Set Your Password</CardTitle>
            <CardDescription className="text-gray-600">
              Welcome! Please set up your permanent password to complete your account activation.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="your@email.com"
                leftIcon={<User className="h-5 w-5 text-gray-400" />}
                error={errors.email?.message}
                disabled={isLoading}
                size="lg"
              />

              <Input
                {...register('temporaryPassword')}
                type={showTempPassword ? 'text' : 'password'}
                label="Temporary Password"
                placeholder="From your invitation email"
                leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowTempPassword(!showTempPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showTempPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                error={errors.temporaryPassword?.message}
                disabled={isLoading}
                size="lg"
              />

              <div>
                <Input
                  {...register('newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  label="New Password"
                  placeholder="At least 8 characters"
                  leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  error={errors.newPassword?.message}
                  disabled={isLoading}
                  size="lg"
                />
                
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${
                        getPasswordStrength(newPassword) < 2 ? 'text-red-600' :
                        getPasswordStrength(newPassword) < 4 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {getStrengthText(getPasswordStrength(newPassword))}
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(getPasswordStrength(newPassword))}`}
                        style={{ width: `${(getPasswordStrength(newPassword) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm New Password"
                placeholder="Repeat your password"
                leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                error={errors.confirmPassword?.message}
                disabled={isLoading}
                size="lg"
              />

              {errors.root && (
                <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p>{errors.root.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                className="mt-8 h-12 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200"
              >
                Activate Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Having trouble? Contact your administrator for help.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<SetupPasswordLoading />}>
      <PasswordSetupForm />
    </Suspense>
  )
} 