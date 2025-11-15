'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setAuthToken } from '@/lib/auth'

function AuthCallbackContent() {
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading…</main>}>
      <AuthCallbackContent />
    </Suspense>
  )
}

