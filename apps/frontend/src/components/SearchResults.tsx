import React, { useState } from 'react'
import { createConnection } from '@/lib/graphql/operations'
import ConnectLimitNotice from './ConnectLimitNotice'
import LinkedInRequiredModal from './LinkedInRequiredModal'
import TripDetailsRequiredModal from './TripDetailsRequiredModal'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from 'sonner'

type TripDetails = { travelDateFrom: string; travelDateTo: string; guests: number }

type Item = {
  userId: string
  name: string
  university?: string | null
  location?: string | null
  connectionStatus: 'none' | 'pending' | 'connected' | string
  email?: string | null
  profilePhotoUrl?: string | null
  batchYear?: number | null
  proximityMiles?: number | null
  hostMode?: boolean
}

export interface SearchResultsProps {
  items: Item[]
  onAfterConnect?: () => void
  viewMode?: 'card' | 'list'
  travelDateFrom?: string
  travelDateTo?: string
  guests?: number
}

function ConnectionButton({
  item,
  onConnect,
  isConnecting = false,
  justConnected = false
}: {
  item: Item;
  onConnect: () => void;
  isConnecting?: boolean;
  justConnected?: boolean;
}) {
  if (item.connectionStatus === 'pending' || isConnecting || justConnected) {
    return (
      <div className="relative">
        {justConnected && !isConnecting && (
          <>
            <div className="absolute inset-0 animate-ping rounded-lg bg-yellow-400 opacity-75"></div>
            <div className="absolute -inset-1 animate-burst">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-full animate-particle-up"></div>
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2 translate-y-full animate-particle-down"></div>
              <div className="absolute left-0 top-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-y-1/2 -translate-x-full animate-particle-left"></div>
              <div className="absolute right-0 top-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-y-1/2 translate-x-full animate-particle-right"></div>
            </div>
          </>
        )}
        <span className={`relative inline-flex items-center justify-center py-2.5 px-6 rounded-lg text-sm font-medium transition-all duration-300 ${isConnecting
          ? 'bg-yellow-100 text-yellow-800 animate-pulse'
          : justConnected
            ? 'bg-yellow-200 text-yellow-900 scale-110 shadow-lg'
            : 'bg-yellow-50 text-yellow-700'
          }`}>
          {isConnecting ? (
            <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className={`w-4 h-4 mr-1.5 ${justConnected ? 'animate-bounce' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )}
          {isConnecting ? 'Sending...' : 'Pending'}
        </span>
      </div>
    )
  }

  // A host who has since turned off Host Mode won't accept new requests, whether
  // this is a first-time "Book" or a "Book Again" on a past connection - the
  // backend rejects both the same way, so don't offer either.
  if (item.hostMode === false) {
    return (
      <span
        className="inline-flex items-center justify-center py-2.5 px-6 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
        title="This host is not currently accepting bookings"
      >
        Not Hosting
      </span>
    )
  }

  if (item.connectionStatus === 'connected') {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex items-center justify-center py-1 px-3 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
          <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Connected
        </span>
        <button
          className="btn-primary py-2 px-5 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center hover:scale-105 active:scale-95"
          onClick={onConnect}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Book Again
        </button>
      </div>
    )
  }

  return (
    <button
      className="btn-primary py-2.5 px-6 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center hover:scale-105 active:scale-95"
      onClick={onConnect}
    >
      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Book
    </button>
  )
}

function ProfilePhoto({ item, size = 'md' }: { item: Item; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  if (item.profilePhotoUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0`}>
        <img
          src={item.profilePhotoUrl}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className={`${textSizes[size]} font-bold text-primary`}>
        {item.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

export default function SearchResults({ items, onAfterConnect, viewMode = 'card', travelDateFrom, travelDateTo, guests }: SearchResultsProps) {
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null)
  const [justConnectedIds, setJustConnectedIds] = useState<Set<string>>(new Set())

  // Trip details modal state (When/Who, required before a booking request can be sent)
  const [tripModalOpen, setTripModalOpen] = useState(false)
  const [pendingTripItem, setPendingTripItem] = useState<Item | null>(null)

  // LinkedIn modal state
  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false)
  const [pendingConnectItem, setPendingConnectItem] = useState<{ item: Item; trip: TripDetails } | null>(null)

  // Get current user to check for LinkedIn
  const { data: currentUser } = useCurrentUser()
  const hasLinkedIn = !!currentUser?.profile?.linkedin_url?.trim()

  // Actual connection logic (called after trip details + LinkedIn verification pass)
  const performConnect = async (item: Item, trip: TripDetails) => {
    setError(null)
    setLimitReached(false)
    setConnectingUserId(item.userId)
    try {
      await createConnection(item.userId, {
        travel_date_from: trip.travelDateFrom,
        travel_date_to: trip.travelDateTo,
        guests: trip.guests,
      })
      // Mark as just connected for animation
      setJustConnectedIds(prev => new Set(prev).add(item.userId))
      toast.success(`Connection request sent to ${item.name}`)
      // Stop animation after 3 seconds
      setTimeout(() => {
        setJustConnectedIds(prev => {
          const next = new Set(prev)
          next.delete(item.userId)
          return next
        })
      }, 3000)
      // Delay refetch to show animation
      setTimeout(() => {
        onAfterConnect?.()
      }, 1500)
    } catch (e: any) {
      const msg = e?.message || ''
      if (String(msg).includes('DAILY_CAP_REACHED')) {
        setLimitReached(true)
        toast.error('Daily connection limit reached')
      } else if (String(msg).includes('OVERLAPPING_DATES')) {
        toast.error("You already have a booking for overlapping dates - you can't be in two places at once")
      } else if (String(msg).includes('HOST_UNAVAILABLE')) {
        toast.error('This host is already booked for those dates')
      } else if (String(msg).includes('EXCEEDS_HOST_CAPACITY')) {
        toast.error("This host can't fit that many guests")
      } else if (String(msg).includes('HOST_MODE_DISABLED')) {
        toast.error('This host is not currently accepting bookings')
      } else {
        setError('Unable to connect')
        toast.error('Unable to send connection request')
      }
    } finally {
      setConnectingUserId(null)
    }
  }

  // After trip details are known, check for LinkedIn before actually sending the request
  const proceedAfterTripDetails = (item: Item, trip: TripDetails) => {
    if (!hasLinkedIn) {
      setPendingConnectItem({ item, trip })
      setLinkedInModalOpen(true)
    } else {
      performConnect(item, trip)
    }
  }

  // Handle Book button click - trip details (When/Who) are required first
  const handleConnect = (item: Item) => {
    if (item.hostMode === false) {
      toast.error('This host is not currently accepting bookings')
      return
    }
    if (travelDateFrom && travelDateTo && guests) {
      // Already selected in the search bar - use those
      proceedAfterTripDetails(item, { travelDateFrom, travelDateTo, guests })
    } else {
      setPendingTripItem(item)
      setTripModalOpen(true)
    }
  }

  // Handle trip details submitted from the modal
  const handleTripDetailsSubmit = (trip: TripDetails) => {
    setTripModalOpen(false)
    if (pendingTripItem) {
      proceedAfterTripDetails(pendingTripItem, trip)
      setPendingTripItem(null)
    }
  }

  // Handle successful LinkedIn addition
  const handleLinkedInSuccess = () => {
    setLinkedInModalOpen(false)
    if (pendingConnectItem) {
      performConnect(pendingConnectItem.item, pendingConnectItem.trip)
      setPendingConnectItem(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Trip Details Required Modal */}
      <TripDetailsRequiredModal
        isOpen={tripModalOpen}
        onClose={() => {
          setTripModalOpen(false)
          setPendingTripItem(null)
        }}
        onSubmit={handleTripDetailsSubmit}
        targetUserName={pendingTripItem?.name || ''}
      />

      {/* LinkedIn Required Modal */}
      <LinkedInRequiredModal
        isOpen={linkedInModalOpen}
        onClose={() => {
          setLinkedInModalOpen(false)
          setPendingConnectItem(null)
        }}
        onSuccess={handleLinkedInSuccess}
        targetUserName={pendingConnectItem?.item.name || ''}
      />

      {limitReached && (
        <ConnectLimitNotice onDismiss={() => setLimitReached(false)} />
      )}

      {/* Always use card view on mobile, respect viewMode on desktop */}
      <div className="block md:hidden">
        {/* Mobile: Always Card View */}
        <div className="grid grid-cols-1 gap-6">
          {items.map((it) => (
            <div key={it.userId} className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all p-6 ${it.connectionStatus === 'connected'
              ? 'border-primary/40 bg-primary/5'
              : 'border-gray-200'
              }`}>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <ProfilePhoto item={it} size="lg" />
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-1">{it.name}</h3>

                {it.connectionStatus === 'connected' && it.email && (
                  <a href={`mailto:${it.email}`} className="text-sm text-primary hover:underline mb-2">
                    {it.email}
                  </a>
                )}

                {it.university && (
                  <p className="text-sm text-gray-600 mb-1">
                    {it.university}
                    {it.batchYear && ` • ${it.batchYear}`}
                  </p>
                )}

                {it.location && (
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {it.location}
                    {it.proximityMiles !== null && it.proximityMiles !== undefined && (
                      <span className="text-primary font-semibold">• {Math.round(it.proximityMiles)} mi</span>
                    )}
                  </p>
                )}

                <div className="mt-auto w-full">
                  <div className="flex justify-center">
                    <ConnectionButton item={it} onConnect={() => handleConnect(it)} isConnecting={connectingUserId === it.userId} justConnected={justConnectedIds.has(it.userId)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Respect viewMode */}
      <div className="hidden md:block">
        {viewMode === 'card' ? (
          // Card View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (
              <div key={it.userId} className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all p-6 ${it.connectionStatus === 'connected'
                ? 'border-primary/40 bg-primary/5'
                : 'border-gray-200'
                }`}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">
                    <ProfilePhoto item={it} size="lg" />
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1">{it.name}</h3>

                  {it.connectionStatus === 'connected' && it.email && (
                    <a href={`mailto:${it.email}`} className="text-sm text-primary hover:underline mb-2">
                      {it.email}
                    </a>
                  )}

                  {it.university && (
                    <p className="text-sm text-gray-600 mb-1">
                      {it.university}
                      {it.batchYear && ` • ${it.batchYear}`}
                    </p>
                  )}

                  {it.location && (
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {it.location}
                      {it.proximityMiles !== null && it.proximityMiles !== undefined && (
                        <span className="text-primary font-semibold">• {Math.round(it.proximityMiles)} mi</span>
                      )}
                    </p>
                  )}

                  <div className="mt-auto w-full">
                    <div className="flex justify-center">
                      <ConnectionButton item={it} onConnect={() => handleConnect(it)} isConnecting={connectingUserId === it.userId} justConnected={justConnectedIds.has(it.userId)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View - Individual cards stacked vertically
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.userId} className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all p-5 ${it.connectionStatus === 'connected'
                ? 'border-primary/40 bg-primary/5'
                : 'border-gray-200'
                }`}>
                <div className="flex items-center gap-4">
                  <ProfilePhoto item={it} size="md" />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate mb-1">{it.name}</h3>

                    {it.connectionStatus === 'connected' && it.email && (
                      <a href={`mailto:${it.email}`} className="text-sm text-primary hover:underline truncate block">
                        {it.email}
                      </a>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {it.university && (
                        <span className="text-sm text-gray-600">
                          {it.university}
                          {it.batchYear && ` • ${it.batchYear}`}
                        </span>
                      )}
                      {it.location && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {it.location}
                          {it.proximityMiles !== null && it.proximityMiles !== undefined && (
                            <span className="text-primary font-semibold">• {Math.round(it.proximityMiles)} mi</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <ConnectionButton item={it} onConnect={() => handleConnect(it)} isConnecting={connectingUserId === it.userId} justConnected={justConnectedIds.has(it.userId)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="alert-error mt-4">
          <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}
