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
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const supabase = createSupabaseClient()

  const addDebugInfo = (info: string) => {
    console.log(`🔍 DEBUG: ${info}`)
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${info}`])
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        addDebugInfo('🔄 Starting auth callback processing...')
        addDebugInfo(`📍 Current URL: ${window.location.href}`)
        addDebugInfo(`📍 Pathname: ${window.location.pathname}`)
        addDebugInfo(`📍 Search: ${window.location.search}`)
        addDebugInfo(`📍 Hash: ${window.location.hash}`)
        
        // Log all search params
        const allParams = Array.from(searchParams.entries())
        addDebugInfo(`🔍 Search params: ${JSON.stringify(allParams)}`)
        
        // Method 1: Handle hash-based tokens (Supabase email confirmation)
        const hash = window.location.hash
        addDebugInfo(`🔍 Hash fragment: ${hash}`)
        
        if (hash) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const type = params.get('type')
          
          addDebugInfo(`🔍 Token type: ${type}`)
          addDebugInfo(`🔍 Access token present: ${!!accessToken}`)
          addDebugInfo(`🔍 Refresh token present: ${!!refreshToken}`)
          
          if (accessToken) {
            addDebugInfo('✅ Found access token, setting session...')
            
            // Set the session with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error) {
              addDebugInfo(`❌ Error setting session: ${error.message}`)
              setError('Failed to authenticate. Please try again.')
              return
            }
            
            if (data.session) {
              addDebugInfo('✅ Session established successfully')
              addDebugInfo(`🔍 User email: ${data.session.user.email}`)
              addDebugInfo(`🔍 User confirmed: ${data.session.user.email_confirmed_at}`)
              toast.success('Email confirmed successfully!')
              
              // Set initial onboarding metadata
              try {
                const { error: metadataError } = await supabase.auth.updateUser({
                  data: {
                    onboarding_complete: false,
                    onboarding_started_at: new Date().toISOString()
                  }
                })
                
                if (metadataError) {
                  addDebugInfo(`⚠️ Failed to set initial metadata: ${metadataError.message}`)
                } else {
                  addDebugInfo('✅ Initial onboarding metadata set')
                }
              } catch (error) {
                addDebugInfo(`⚠️ Metadata update failed: ${error}`)
              }
              
              // Store onboarding state
              localStorage.setItem('onboarding_step', '1')
              
              addDebugInfo('🔄 Checking onboarding type...')
              // Check what type of onboarding is needed
              try {
                const response = await fetch('/api/auth/check-onboarding')
                const result = await response.json()
                const { needsUserProfileCompletion, needsOrganizationOnboarding } = result.data || result
                
                if (needsUserProfileCompletion) {
                  addDebugInfo('👤 Redirecting to team member onboarding...')
                  router.push('/onboarding/user')
                } else if (needsOrganizationOnboarding) {
                  addDebugInfo('🏢 Redirecting to organization onboarding...')
                  router.push('/onboarding')
                } else {
                  addDebugInfo('🏠 Redirecting to dashboard...')
                  router.push('/dashboard')
                }
              } catch (error) {
                addDebugInfo(`⚠️ Error checking onboarding type: ${error}`)
                // Fallback to organization onboarding
                router.push('/onboarding')
              }
              return
            }
          }
        }
        
        // Method 2: Check for existing session (primary method for code-based auth)
        addDebugInfo('🔍 Checking for existing session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          addDebugInfo(`❌ Session error: ${sessionError.message}`)
          setError('Unable to verify your session. Please try again.')
          return
        }
        
        if (session?.user) {
          addDebugInfo('✅ Found existing session')
          addDebugInfo(`🔍 User email: ${session.user.email}`)
          addDebugInfo(`🔍 User confirmed: ${session.user.email_confirmed_at}`)
          addDebugInfo(`🔍 User metadata: ${JSON.stringify(session.user.user_metadata)}`)
          toast.success('Email confirmed successfully!')
          
          // Set initial onboarding metadata if not already set
          if (!session.user.user_metadata?.onboarding_complete) {
            try {
              const { error: metadataError } = await supabase.auth.updateUser({
                data: {
                  onboarding_complete: false,
                  onboarding_started_at: new Date().toISOString()
                }
              })
              
              if (metadataError) {
                addDebugInfo(`⚠️ Failed to set initial metadata: ${metadataError.message}`)
              } else {
                addDebugInfo('✅ Initial onboarding metadata set')
              }
            } catch (error) {
              addDebugInfo(`⚠️ Metadata update failed: ${error}`)
            }
          }
          
          // Store onboarding state
          localStorage.setItem('onboarding_step', '1')
          
          addDebugInfo('🔄 Checking onboarding type...')
          // Check what type of onboarding is needed
          try {
            const response = await fetch('/api/auth/check-onboarding')
            const result = await response.json()
            const { needsUserProfileCompletion, needsOrganizationOnboarding } = result.data || result
            
            if (needsUserProfileCompletion) {
              addDebugInfo('👤 Redirecting to team member onboarding...')
              router.push('/onboarding/user')
            } else if (needsOrganizationOnboarding) {
              addDebugInfo('🏢 Redirecting to organization onboarding...')
              router.push('/onboarding')
            } else {
              addDebugInfo('🏠 Redirecting to dashboard...')
              router.push('/dashboard')
            }
          } catch (error) {
            addDebugInfo(`⚠️ Error checking onboarding type: ${error}`)
            // Fallback to organization onboarding
            router.push('/onboarding')
          }
          return
        }
        
        // Method 3: Handle error parameters
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          addDebugInfo(`❌ Auth error: ${errorParam}`)
          addDebugInfo(`❌ Error description: ${errorDescription}`)
          
          // Handle specific error cases
          if (errorParam === 'otp_expired') {
            setError('The confirmation link has expired. Please request a new one.')
          } else {
            setError(`Authentication failed: ${errorDescription || errorParam}`)
          }
          return
        }
        
        // If we get here, something went wrong
        addDebugInfo('❌ No authentication method worked')
        addDebugInfo('❌ No tokens found in URL')
        addDebugInfo('❌ No existing session found')
        setError('Unable to complete authentication. Please try signing up again.')
        
      } catch (error) {
        addDebugInfo(`❌ Callback processing error: ${error}`)
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
            {/* Debug info */}
            {debugInfo.length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left max-h-32 overflow-y-auto">
                <p className="font-semibold mb-2">Debug Info:</p>
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-gray-600">{info}</div>
                ))}
              </div>
            )}
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
            {/* Debug info */}
            {debugInfo.length > 0 && (
              <div className="p-3 bg-gray-100 rounded text-xs text-left max-h-32 overflow-y-auto">
                <p className="font-semibold mb-2">Debug Info:</p>
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-gray-600">{info}</div>
                ))}
              </div>
            )}
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