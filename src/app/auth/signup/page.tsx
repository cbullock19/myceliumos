'use client'

import React, { useState } from 'react'
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
import { Eye, EyeOff, Building, User, Mail, Lock, AlertCircle } from 'lucide-react'

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
  const supabase = createSupabaseClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  })

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
          }
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
        // Redirect to email verification page
        router.push('/auth/verify-email?email=' + encodeURIComponent(data.email))
      }
    } catch (error) {
      console.error('Signup error:', error)
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
            <CardTitle className="text-3xl font-bold text-gray-900">Start your free trial</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Get your agency operational in 10 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                {...register('companyName')}
                label="Company Name"
                placeholder="Acme Creative Agency"
                leftIcon={<Building className="h-5 w-5 text-gray-400" />}
                error={errors.companyName?.message}
                disabled={isLoading}
                size="lg"
              />

              <Input
                {...register('name')}
                label="Your Name"
                placeholder="John Smith"
                leftIcon={<User className="h-5 w-5 text-gray-400" />}
                error={errors.name?.message}
                disabled={isLoading}
                size="lg"
              />

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
                autoComplete="new-password"
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

              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                className="mt-8 h-12 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all duration-200"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center px-6 py-3 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold rounded-lg transition-colors duration-200"
                >
                  Sign in instead
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
          <div className="mb-4">
            By signing up, you agree to our{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Privacy Policy
            </a>
          </div>
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
} 