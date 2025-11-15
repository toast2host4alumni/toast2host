'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setAuthToken } from '@/lib/auth'

export default function AuthCallbackPage() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const jwt = params.get('jwt') || params.get('access_token')
    if (jwt) {
      setAuthToken(jwt)
      // After login, send user to onboarding to complete required fields
      router.replace('/onboarding')
    } else {
      router.replace('/signin')
    }
  }, [params, router])

  return (
    <main className="p-6">Signing you in…</main>
  )
}

