import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAuthenticated, removeAuthToken } from '@/lib/auth'
import { getMyPendingConnections } from '@/lib/graphql/operations'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isAuthed, setIsAuthed] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    // Check auth on mount and whenever pathname changes (after login redirect)
    const checkAuth = () => {
      setIsAuthed(isAuthenticated())
    }
    checkAuth()
  }, [location.pathname])

  useEffect(() => {
    // Fetch pending connections count when authenticated
    const fetchPendingCount = async () => {
      if (!isAuthed) {
        setPendingCount(0)
        return
      }
      try {
        const pending = await getMyPendingConnections()
        setPendingCount(pending.length)
      } catch {
        setPendingCount(0)
      }
    }

    fetchPendingCount()

    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    return () => clearInterval(interval)
  }, [isAuthed, location.pathname])

  const handleLogout = () => {
    removeAuthToken()
    queryClient.clear()
    setIsAuthed(false)
    navigate('/signin', { replace: true })
  }

  return (
    <header className="border-b border-gray-200 bg-primary sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/t2h_logo.png" alt="Toast2Host" className="h-12 w-auto object-contain" onError={(e) => {
            console.error('Logo failed to load')
            e.currentTarget.style.display = 'none'
          }} />
        </Link>

        <nav className="flex items-center gap-2 md:gap-6">
          {isAuthed ? (
            <>
              {/* Protected navigation - only show when authenticated */}
              <Link
                to="/search"
                className="text-gray-900 hover:text-gray-700 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-black/5"
              >
                <span className="hidden md:inline">Search</span>
                <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
              <Link
                to="/connections"
                className="relative text-gray-900 hover:text-gray-700 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-black/5"
              >
                <span className="hidden md:inline">Connections</span>
                <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="text-gray-900 hover:text-gray-700 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-black/5"
              >
                <span className="hidden md:inline">Profile</span>
                <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-black text-primary rounded-lg px-5 py-2 text-sm font-bold hover:bg-gray-900 ml-2 transition-all"
              >
                <span className="hidden md:inline">Sign Out</span>
                <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {/* Public navigation - only show when not authenticated and not on signin page */}
              {location.pathname !== '/signin' && (
                <Link
                  to="/signin"
                  className="bg-black text-primary rounded-lg px-9 py-2 text-sm font-bold shadow-md hover:shadow-lg hover:bg-gray-900 transition-all"
                >
                  <span className="hidden md:inline">Sign In</span>
                  <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
