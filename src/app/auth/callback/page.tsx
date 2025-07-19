'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Processing auth callback...')
        
        // Method 1: Handle hash-based tokens (Supabase email confirmation)
        const hash = window.location.hash
        console.log('Hash fragment:', hash)
        
        if (hash) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const type = params.get('type')
          
          console.log('Token type:', type, 'Access token present:', !!accessToken)
          
          if (accessToken) {
            console.log('✅ Found access token, setting session...')
            
            // Set the session with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error) {
              console.error('❌ Error setting session:', error)
              setError('Failed to authenticate. Please try again.')
              return
            }
            
            if (data.session) {
              console.log('✅ Session established successfully')
              toast.success('Email confirmed successfully!')
              
              // Store onboarding state
              localStorage.setItem('onboarding_step', '1')
              
              // Redirect to onboarding
              router.push('/onboarding')
              return
            }
          }
        }
        
        // Method 2: Handle query parameter tokens (fallback)
        const code = searchParams.get('code')
        if (code) {
          console.log('✅ Found code parameter, exchanging for session...')
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('❌ Code exchange error:', error)
            setError('Failed to authenticate. Please try again.')
            return
          }
          
          if (data.session) {
            console.log('✅ Session established via code exchange')
            toast.success('Email confirmed successfully!')
            
            // Store onboarding state
            localStorage.setItem('onboarding_step', '1')
            
            // Redirect to onboarding
            router.push('/onboarding')
            return
          }
        }
        
        // Method 3: Check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError('Unable to verify your session. Please try again.')
          return
        }
        
        if (session?.user) {
          console.log('✅ Found existing session, redirecting to onboarding...')
          toast.success('Email confirmed successfully!')
          
          // Store onboarding state
          localStorage.setItem('onboarding_step', '1')
          
          router.push('/onboarding')
          return
        }
        
        // Method 4: Handle error parameters
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          console.error('❌ Auth error:', errorParam, errorDescription)
          
          // Handle specific error cases
          if (errorParam === 'otp_expired') {
            setError('The confirmation link has expired. Please request a new one.')
          } else {
            setError(`Authentication failed: ${errorDescription || errorParam}`)
          }
          return
        }
        
        // If we get here, something went wrong
        setError('Unable to complete authentication. Please try signing up again.')
        
      } catch (error) {
        console.error('❌ Callback processing error:', error)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [router, searchParams, supabase.auth])

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Confirming Your Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Please wait while we verify your email confirmation...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Confirmation Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">
              {error}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/auth/signup')}
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Loading...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Please wait while we process your request...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
} 