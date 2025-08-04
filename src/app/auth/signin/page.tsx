'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'

const signinSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

type SigninFormData = z.infer<typeof signinSchema>

export default function SigninPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createSupabaseClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema)
  })

  const onSubmit = async (data: SigninFormData) => {
    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('root', { message: 'Invalid email or password' })
        } else {
          setError('root', { message: authError.message })
        }
        return
      }

      if (authData.user) {
        // Check if user needs onboarding or password change
        const response = await fetch('/api/auth/check-onboarding')
        const result = await response.json()
        const { 
          needsOnboarding, 
          needsOrganizationOnboarding, 
          needsUserProfileCompletion, 
          userStatus, 
          isFirstLogin 
        } = result.data || result
        
        console.log('🔍 Signin flow - check-onboarding result:', result)
        console.log('🔍 userStatus:', userStatus, 'isFirstLogin:', isFirstLogin, 'needsOnboarding:', needsOnboarding)
        console.log('🔍 needsOrganizationOnboarding:', needsOrganizationOnboarding, 'needsUserProfileCompletion:', needsUserProfileCompletion)
        
        // If user has PENDING status, they need to set a permanent password first
        if (userStatus === 'PENDING' || isFirstLogin) {
          console.log('🔑 Redirecting to password setup...')
          router.push('/auth/setup-password')
        } else if (needsUserProfileCompletion) {
          console.log('👤 Redirecting to team member profile completion...')
          router.push('/onboarding/user')
        } else if (needsOrganizationOnboarding) {
          console.log('🏢 Redirecting to organization onboarding...')
          router.push('/onboarding')
        } else {
          console.log('🏠 Redirecting to dashboard...')
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Signin error:', error)
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
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
          <p className="mt-3 text-lg text-gray-600 font-medium">The Operations Platform for Creative Agencies</p>
        </div>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl shadow-emerald-100/50">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900">Welcome back</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Sign in to your agency dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="john@acmecreative.com"
                autoComplete="email"
                leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
                error={errors.email?.message}
                disabled={isLoading}
                size="lg"
              />

              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                error={errors.password?.message}
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

              <div className="flex items-center justify-between">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                className="mt-8 h-12 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center px-6 py-3 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold rounded-lg transition-colors duration-200"
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2024 Mycelium OS. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
} 