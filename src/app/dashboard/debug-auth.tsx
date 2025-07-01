'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'

export default function DebugAuth() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        setAuthStatus({
          user: user ? {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata
          } : null,
          error: error?.message,
          timestamp: new Date().toISOString()
        })
      } catch (err) {
        setAuthStatus({
          error: `Catch error: ${err}`,
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) return <div>Checking auth...</div>

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">Authentication Debug</h3>
      <pre className="text-xs bg-white p-2 rounded overflow-auto">
        {JSON.stringify(authStatus, null, 2)}
      </pre>
    </div>
  )
} 