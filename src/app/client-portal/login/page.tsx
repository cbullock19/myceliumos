'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormData = z.infer<typeof loginSchema>

interface OrganizationBranding {
  primaryColor: string
  logoUrl?: string
  companyName: string
  customCSS?: string
}

export default function ClientPortalLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [organizationBranding, setOrganizationBranding] = useState<OrganizationBranding | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  useEffect(() => {
    // Load organization branding from URL params or default
    const urlParams = new URLSearchParams(window.location.search)
    const orgSlug = urlParams.get('org')
    
    if (orgSlug) {
      // In a real implementation, we'd fetch branding from the API
      // For now, use default branding
      setOrganizationBranding({
        primaryColor: '#059669',
        companyName: 'Your Agency',
        logoUrl: undefined
      })
    }
  }, [])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/client-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'INVALID_CREDENTIALS') {
          setError('root', { message: 'Invalid email or password' })
        } else if (result.error === 'ACCOUNT_INACTIVE') {
          setError('root', { message: 'Your account has been deactivated. Please contact your project team.' })
        } else if (result.error === 'PASSWORD_SETUP_REQUIRED') {
          // Redirect to password setup
          router.push('/client-portal/setup-password')
          return
        } else {
          setError('root', { message: result.error || 'An unexpected error occurred' })
        }
        return
      }

      // Success - redirect to dashboard
      toast.success('Welcome back!')
      router.push('/client-portal/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          {organizationBranding?.logoUrl ? (
            <img 
              className="mx-auto h-12 w-auto" 
              src={organizationBranding.logoUrl} 
              alt={organizationBranding.companyName}
            />
          ) : (
            <div 
              className="mx-auto h-12 w-32 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded flex items-center justify-center"
              style={{ 
                backgroundColor: organizationBranding?.primaryColor || '#059669'
              }}
            >
              <span className="text-white font-semibold text-lg">
                {organizationBranding?.companyName || 'Client Portal'}
              </span>
            </div>
          )}
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your client portal
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white shadow-xl">
          <CardContent className="px-8 py-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Error message */}
              {errors.root && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">{errors.root.message}</p>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="your.email@company.com"
                  autoComplete="email"
                  leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
                  error={errors.email?.message}
                  disabled={isLoading}
                  size="lg"
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
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
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Help text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact your project team
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 