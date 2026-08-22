import { useEffect, useRef, Suspense } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setAuthToken } from '@/lib/auth'

function AuthCallbackContent() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    async function handleCallback() {
      try {
        // Get Google's access_token from Strapi redirect
        const accessToken = searchParams.get('access_token')

        if (!accessToken) {
          navigate('/signin', { replace: true })
          return
        }

        const STRAPI_URL = import.meta.env.VITE_STRAPI_URL

        if (!STRAPI_URL) {
          throw new Error('VITE_STRAPI_URL is not defined')
        }

        const response = await fetch(
          `${STRAPI_URL}/api/auth/google/callback?access_token=${accessToken}`
        )

        if (!response.ok) {
          throw new Error('Failed to authenticate')
        }

        const data = await response.json()

        if (!data.jwt) {
          throw new Error('No JWT received')
        }

        setAuthToken(data.jwt)

        // Sync name/photo from Google. Server-side, since the profile
        // update GraphQL mutation deliberately can't set these fields
        // (name is locked to the authenticated Google identity).
        try {
          await fetch(`${STRAPI_URL}/api/sync-google-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken, jwt: data.jwt }),
          })
        } catch (syncError) {
          console.error('Failed to sync Google profile data:', syncError)
        }

        navigate('/search', { replace: true })
      } catch (error) {
        console.error('Auth error:', error)
        navigate('/signin', { replace: true })
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-lg font-semibold text-gray-900">Signing you in...</p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading...</main>}>
      <AuthCallbackContent />
    </Suspense>
  )
}
