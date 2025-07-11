'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const passwordSetupSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type PasswordSetupFormData = z.infer<typeof passwordSetupSchema>

export default function ClientPortalSetupPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<PasswordSetupFormData>({
    resolver: zodResolver(passwordSetupSchema)
  })

  const newPassword = watch('newPassword')

  const onSubmit = async (data: PasswordSetupFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/client-auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'INVALID_CURRENT_PASSWORD') {
          setError('currentPassword', { message: 'Current password is incorrect' })
        } else if (result.error === 'PASSWORD_TOO_WEAK') {
          setError('newPassword', { message: 'Password does not meet security requirements' })
        } else {
          setError('root', { message: result.error || 'An unexpected error occurred' })
        }
        return
      }

      // Success - redirect to dashboard
      toast.success('Password set successfully!')
      router.push('/client-portal/dashboard')
    } catch (error) {
      console.error('Password setup error:', error)
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
            Please set a secure password for your account
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

              {/* Current password field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <Input
                  {...register('currentPassword')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  error={errors.currentPassword?.message}
                  disabled={isLoading}
                  size="lg"
                />
              </div>

              {/* New password field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <Input
                  {...register('newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Create a new password"
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
                
                {/* Password requirements */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-600">Password requirements:</p>
                    <div className="space-y-1">
                      <div className={`flex items-center space-x-2 text-xs ${
                        newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {newPassword.length >= 8 ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center space-x-2 text-xs ${
                        /[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {/[a-z]/.test(newPassword) ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}
                        <span>One lowercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-2 text-xs ${
                        /[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {/[A-Z]/.test(newPassword) ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-2 text-xs ${
                        /\d/.test(newPassword) ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {/\d/.test(newPassword) ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}
                        <span>One number</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
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
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {isLoading ? 'Setting Password...' : 'Set Password'}
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