import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireOnboarding?: boolean
}

export default function AuthGuard({ children, fallback, requireOnboarding = true }: AuthGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthed = isAuthenticated()
  const { data: user, isLoading, isError } = useCurrentUser()

  const isOnboarded = !!user?.profile?.onboarding_completed

  useEffect(() => {
    if (!isAuthed) {
      navigate('/signin', { replace: true })
      return
    }

    if (requireOnboarding && !isLoading) {
      if (isError || !isOnboarded) {
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true })
        }
      }
    }
  }, [navigate, location.pathname, requireOnboarding, isAuthed, isLoading, isError, isOnboarded])

  // Show loading state while checking auth
  if (!isAuthed || (requireOnboarding && isLoading)) {
    return (
      fallback || (
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </main>
      )
    )
  }

  // Don't render children if not authenticated
  if (!isAuthed) {
    return null
  }

  // Don't render children if onboarding required but not completed
  if (requireOnboarding && !isOnboarded) {
    return null
  }

  return <>{children}</>
}
