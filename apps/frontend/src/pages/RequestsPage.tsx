import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  approveConnection, getMyPendingConnections, getMyOutgoingPendingConnections, rejectConnection,
  getMyHostedBookings, getMyTrips, cancelConnection,
  type PendingConnection, type OutgoingPendingConnection, type ConfirmedBooking,
} from '@/lib/graphql/operations'
import AuthGuard from '@/components/AuthGuard'
import { toast } from 'sonner'

function WhenWhoBadge({ travelDateFrom, travelDateTo, guestCount, centered = false }: {
  travelDateFrom?: string | null
  travelDateTo?: string | null
  guestCount?: number | null
  centered?: boolean
}) {
  if (!travelDateFrom && !travelDateTo && !guestCount) return null
  return (
    <p className={`text-sm text-gray-500 flex items-center gap-1 mb-2 ${centered ? 'justify-center' : ''}`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {travelDateFrom && travelDateTo && <span>{travelDateFrom} → {travelDateTo}</span>}
      {travelDateFrom && travelDateTo && guestCount ? <span>·</span> : null}
      {guestCount ? <span>{guestCount} guest{guestCount > 1 ? 's' : ''}</span> : null}
    </p>
  )
}

function EmptyState({ icon, title, subtitle, tint = 'primary' }: { icon: React.ReactNode; title: string; subtitle: string; tint?: 'primary' | 'yellow' | 'green' }) {
  const tintClasses = {
    primary: 'from-primary/10 to-primary/5 text-primary',
    yellow: 'from-yellow-100 to-yellow-50 text-yellow-600',
    green: 'from-green-100 to-green-50 text-green-600',
  }[tint]
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className={`w-20 h-20 bg-gradient-to-br ${tintClasses} rounded-full flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-lg font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-sm">{subtitle}</p>
    </div>
  )
}

function PendingRequestsList({ items, processingId, celebratingIds, onApprove, onReject, formatDate }: {
  items: PendingConnection[]
  processingId: string | null
  celebratingIds: Set<string>
  onApprove: (item: PendingConnection) => void
  onReject: (item: PendingConnection) => void
  formatDate: (d: string) => string
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        tint="primary"
        icon={
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        title="No booking requests"
        subtitle="When someone wants to book with you, requests will appear here"
      />
    )
  }
  return (
    <>
      {/* Mobile: Card View */}
      <div className="block md:hidden space-y-4">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                {it.requester.profilePhotoUrl ? (
                  <img src={it.requester.profilePhotoUrl} alt={it.requester.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{it.requester.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{it.requester.name}</h3>
              <span className="text-xs text-gray-500 mb-2">{formatDate(it.createdAt)}</span>
              {it.requester.university && (
                <p className="text-sm text-gray-600 mb-1">
                  {it.requester.university}
                  {it.requester.batchYear && ` - ${it.requester.batchYear}`}
                </p>
              )}
              {it.requester.location && (
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {it.requester.location}
                </p>
              )}
              <WhenWhoBadge travelDateFrom={it.travelDateFrom} travelDateTo={it.travelDateTo} guestCount={it.guestCount} centered />
              {it.requester.linkedinUrl && (
                <a href={it.requester.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  View LinkedIn
                </a>
              )}
              <div className="flex gap-3 w-full mt-2">
                {celebratingIds.has(it.id) ? (
                  <div className="flex-1 relative">
                    <span className="relative flex-1 bg-green-500 text-white font-bold py-2.5 rounded-lg shadow-lg text-sm flex items-center justify-center scale-110">
                      <svg className="w-4 h-4 mr-1.5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Confirmed!
                    </span>
                  </div>
                ) : (
                  <button
                    className="flex-1 bg-primary text-black font-bold py-2.5 rounded-lg shadow-md hover:shadow-lg hover:bg-primary-dark transition-all text-sm disabled:opacity-50"
                    onClick={() => onApprove(it)}
                    disabled={processingId === it.id}
                  >
                    {processingId === it.id ? 'Approving...' : 'Approve'}
                  </button>
                )}
                <button
                  className="flex-1 bg-white text-gray-700 font-semibold py-2.5 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:text-red-600 transition-all text-sm disabled:opacity-50"
                  onClick={() => onReject(it)}
                  disabled={processingId === it.id || celebratingIds.has(it.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: List View */}
      <div className="hidden md:block space-y-3">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {it.requester.profilePhotoUrl ? (
                  <img src={it.requester.profilePhotoUrl} alt={it.requester.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{it.requester.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{it.requester.name}</h3>
                  <span className="text-xs text-gray-500">{formatDate(it.createdAt)}</span>
                </div>
                {it.requester.university && (
                  <p className="text-sm text-gray-600 mb-1">
                    {it.requester.university}
                    {it.requester.batchYear && ` - Class of ${it.requester.batchYear}`}
                  </p>
                )}
                {it.requester.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {it.requester.location}
                  </p>
                )}
                <WhenWhoBadge travelDateFrom={it.travelDateFrom} travelDateTo={it.travelDateTo} guestCount={it.guestCount} />
                {it.requester.linkedinUrl && (
                  <a href={it.requester.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    View LinkedIn
                  </a>
                )}
              </div>
              <div className="flex gap-3 flex-shrink-0">
                {celebratingIds.has(it.id) ? (
                  <div className="relative">
                    <span className="relative bg-green-500 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg text-sm inline-flex items-center scale-110">
                      <svg className="w-4 h-4 mr-1.5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Confirmed!
                    </span>
                  </div>
                ) : (
                  <button
                    className="bg-primary text-black font-bold px-5 py-2 rounded-lg shadow-md hover:shadow-lg hover:bg-primary-dark transition-all text-sm disabled:opacity-50"
                    onClick={() => onApprove(it)}
                    disabled={processingId === it.id}
                  >
                    {processingId === it.id ? (
                      <svg className="animate-spin h-4 w-4 mx-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5 inline" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                )}
                <button
                  className="bg-white text-gray-700 font-semibold px-5 py-2 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:text-red-600 transition-all text-sm disabled:opacity-50"
                  onClick={() => onReject(it)}
                  disabled={processingId === it.id || celebratingIds.has(it.id)}
                >
                  <svg className="w-4 h-4 mr-1.5 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function OutgoingRequestsList({ items, formatDate, onCancel }: { items: OutgoingPendingConnection[]; formatDate: (d: string) => string; onCancel: (item: OutgoingPendingConnection) => void }) {
  if (items.length === 0) {
    return (
      <EmptyState
        tint="yellow"
        icon={
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="No pending booking requests"
        subtitle="Your sent booking requests will appear here"
      />
    )
  }
  return (
    <>
      {/* Mobile: Card View */}
      <div className="block md:hidden space-y-4">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                {it.targetUser.profilePhotoUrl ? (
                  <img src={it.targetUser.profilePhotoUrl} alt={it.targetUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-yellow-600">{it.targetUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{it.targetUser.name}</h3>
              <span className="text-xs text-gray-500 mb-2">Sent {formatDate(it.createdAt)}</span>
              {it.targetUser.university && (
                <p className="text-sm text-gray-600 mb-1">
                  {it.targetUser.university}
                  {it.targetUser.batchYear && ` - ${it.targetUser.batchYear}`}
                </p>
              )}
              {it.targetUser.location && (
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {it.targetUser.location}
                </p>
              )}
              <WhenWhoBadge travelDateFrom={it.travelDateFrom} travelDateTo={it.travelDateTo} guestCount={it.guestCount} centered />
              {it.targetUser.linkedinUrl && (
                <a href={it.targetUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  View LinkedIn
                </a>
              )}
              <span className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-medium mt-2">
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Pending
              </span>
              <button
                type="button"
                onClick={() => onCancel(it)}
                className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors mt-2 underline"
              >
                Cancel Request
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: List View */}
      <div className="hidden md:block space-y-3">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {it.targetUser.profilePhotoUrl ? (
                  <img src={it.targetUser.profilePhotoUrl} alt={it.targetUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                    <span className="text-xl font-bold text-yellow-600">{it.targetUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{it.targetUser.name}</h3>
                  <span className="text-xs text-gray-500">Sent {formatDate(it.createdAt)}</span>
                </div>
                {it.targetUser.university && (
                  <p className="text-sm text-gray-600 mb-1">
                    {it.targetUser.university}
                    {it.targetUser.batchYear && ` - Class of ${it.targetUser.batchYear}`}
                  </p>
                )}
                {it.targetUser.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {it.targetUser.location}
                  </p>
                )}
                <WhenWhoBadge travelDateFrom={it.travelDateFrom} travelDateTo={it.travelDateTo} guestCount={it.guestCount} />
                {it.targetUser.linkedinUrl && (
                  <a href={it.targetUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    View LinkedIn
                  </a>
                )}
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <span className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-medium">
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Pending
                </span>
                <button
                  type="button"
                  onClick={() => onCancel(it)}
                  className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors underline"
                >
                  Cancel Request
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function ConfirmedBookingsList({ items, emptyTitle, emptySubtitle, formatDate, onCancel }: {
  items: ConfirmedBooking[]
  emptyTitle: string
  emptySubtitle: string
  formatDate: (d: string) => string
  onCancel: (item: ConfirmedBooking) => void
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        tint="green"
        icon={
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    )
  }
  return (
    <>
      {/* Mobile: Card View */}
      <div className="block md:hidden space-y-4">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                {it.otherUser.profilePhotoUrl ? (
                  <img src={it.otherUser.profilePhotoUrl} alt={it.otherUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">{it.otherUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{it.otherUser.name}</h3>
              <span className="text-xs text-gray-500 mb-2">Confirmed {formatDate(it.confirmedAt || it.createdAt)}</span>
              {it.otherUser.email && (
                <a href={`mailto:${it.otherUser.email}`} className="text-sm text-primary hover:underline mb-2">{it.otherUser.email}</a>
              )}
              {it.otherUser.university && (
                <p className="text-sm text-gray-600 mb-1">
                  {it.otherUser.university}
                  {it.otherUser.batchYear && ` - ${it.otherUser.batchYear}`}
                </p>
              )}
              {it.otherUser.location && (
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {it.otherUser.location}
                </p>
              )}
              <WhenWhoBadge travelDateFrom={it.travelDateFrom} travelDateTo={it.travelDateTo} guestCount={it.guestCount} centered />
              {it.otherUser.linkedinUrl && (
                <a href={it.otherUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  View LinkedIn
                </a>
              )}
              <span className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-green-50 text-green-700 text-sm font-medium mt-2">
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Confirmed
              </span>
              <button
                type="button"
                onClick={() => onCancel(it)}
                className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors mt-2 underline"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: List View */}
      <div className="hidden md:block space-y-3">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {it.otherUser.profilePhotoUrl ? (
                  <img src={it.otherUser.profilePhotoUrl} alt={it.otherUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                    <span className="text-xl font-bold text-green-600">{it.otherUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{it.otherUser.name}</h3>
                  <span className="text-xs text-gray-500">Confirmed {formatDate(it.confirmedAt || it.createdAt)}</span>
                </div>
                {it.otherUser.email && <a href={`mailto:${it.otherUser.email}`} className="text-sm text-primary hover:underline mb-1 block">{it.otherUser.email}</a>}
                {it.otherUser.university && (
                  <p className="text-sm text-gray-600 mb-1">
                    {it.otherUser.university}
                    {it.otherUser.batchYear && ` - Class of ${it.otherUser.batchYear}`}
                  </p>
                )}
                {it.otherUser.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {it.otherUser.location}
                  </p>
                )}
                <WhenWhoBadge travelDateFrom={it.travelDateFrom} travelDateTo={it.travelDateTo} guestCount={it.guestCount} />
                {it.otherUser.linkedinUrl && (
                  <a href={it.otherUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    View LinkedIn
                  </a>
                )}
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <span className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Confirmed
                </span>
                <button
                  type="button"
                  onClick={() => onCancel(it)}
                  className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors underline"
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function RequestsContent() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [activeGroup, setActiveGroup] = useState<'hosting' | 'traveling'>('hosting')
  const [hostingTab, setHostingTab] = useState<'requests' | 'guests'>('requests')
  const [travelTab, setTravelTab] = useState<'requests' | 'trips'>('requests')

  const [pendingItems, setPendingItems] = useState<PendingConnection[]>([])
  const [hostedBookings, setHostedBookings] = useState<ConfirmedBooking[]>([])
  const [outgoingItems, setOutgoingItems] = useState<OutgoingPendingConnection[]>([])
  const [trips, setTrips] = useState<ConfirmedBooking[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; item: PendingConnection } | null>(null)
  const [celebratingIds, setCelebratingIds] = useState<Set<string>>(new Set())
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string; wasConfirmed: boolean; onConfirmed: () => void } | null>(null)
  const [cancelling, setCancelling] = useState(false)

  async function loadPending() {
    try {
      setPendingItems(await getMyPendingConnections())
    } catch {
      setError('Failed to load booking requests')
    }
  }

  async function loadHosted() {
    try {
      setHostedBookings(await getMyHostedBookings())
    } catch {
      setError('Failed to load hosted bookings')
    }
  }

  async function loadOutgoing() {
    try {
      setOutgoingItems(await getMyOutgoingPendingConnections())
    } catch {
      setError('Failed to load your requests')
    }
  }

  async function loadTrips() {
    try {
      setTrips(await getMyTrips())
    } catch {
      setError('Failed to load your trips')
    }
  }

  async function load() {
    setLoading(true)
    setError(null)
    await Promise.all([loadPending(), loadHosted(), loadOutgoing(), loadTrips()])
    setLoading(false)
  }

  // Track if we should skip the next reload (after an action)
  const skipReloadUntilRef = useRef<number>(0)

  // Load data on mount
  useEffect(() => { load() }, [])

  // Reload ALL data when navigating to this page
  useEffect(() => {
    load()
  }, [location.pathname])

  // Reload ALL data when the active tab changes, but skip if we just performed an action
  useEffect(() => {
    if (Date.now() < skipReloadUntilRef.current) {
      return
    }
    load()
  }, [activeGroup, hostingTab, travelTab])

  // Reload when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() >= skipReloadUntilRef.current) {
        load()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleApproveDirectly = async (item: PendingConnection) => {
    setProcessingId(item.id)
    try {
      const result = await approveConnection(item.id)
      // Show celebration animation
      setCelebratingIds(prev => new Set(prev).add(item.id))
      toast.success(`Approved booking for ${item.requester.name}`)

      // Remove the approved item, plus any other pending requests the backend just
      // auto-rejected for overlapping the same dates (their guests were emailed).
      const autoRejectedIds = new Set(result.autoRejectedIds || [])
      setPendingItems(prev => prev.filter(p => p.id !== item.id && !autoRejectedIds.has(p.id)))
      if (autoRejectedIds.size > 0) {
        // Otherwise the host has no way to know why another pending card just vanished.
        toast.info(
          autoRejectedIds.size === 1
            ? '1 other request for these dates was automatically declined'
            : `${autoRejectedIds.size} other requests for these dates were automatically declined`
        )
      }
      // Header's badge count is a separate poll-based query - nudge it now
      // instead of leaving it stale until the next 30s refetch.
      queryClient.invalidateQueries({ queryKey: ['pendingConnectionsCount'] })

      // Skip any reloads for the next 5 seconds to preserve optimistic update
      skipReloadUntilRef.current = Date.now() + 5000

      // Add to hosted bookings list
      const newBooking: ConfirmedBooking = {
        id: item.id,
        status: 'connected',
        createdAt: item.createdAt,
        confirmedAt: new Date().toISOString(),
        otherUser: item.requester,
        travelDateFrom: item.travelDateFrom,
        travelDateTo: item.travelDateTo,
        guestCount: item.guestCount,
      }
      setHostedBookings(prev => [newBooking, ...prev])

      // Clear celebration after 2 seconds
      setTimeout(() => {
        setCelebratingIds(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }, 2000)
    } catch (e: any) {
      const msg = e?.message || ''
      if (String(msg).includes('HOST_DOUBLE_BOOKED')) {
        toast.error("You already have a confirmed booking for overlapping dates - reject or wait until it's over before approving this one")
      } else {
        toast.error('Failed to approve booking')
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleApprove = async () => {
    if (!confirmAction || confirmAction.type !== 'approve') return
    const item = confirmAction.item
    setConfirmAction(null)
    await handleApproveDirectly(item)
  }

  const handleReject = async () => {
    if (!confirmAction || confirmAction.type !== 'reject') return
    const item = confirmAction.item
    setProcessingId(item.id)
    setConfirmAction(null)
    try {
      await rejectConnection(item.id)
      toast.success(`Rejected request from ${item.requester.name}`)
      load()
      queryClient.invalidateQueries({ queryKey: ['pendingConnectionsCount'] })
    } catch {
      toast.error('Failed to reject booking')
    } finally {
      setProcessingId(null)
    }
  }

  const requestCancelOutgoing = (item: OutgoingPendingConnection) => {
    setCancelTarget({
      id: item.id,
      name: item.targetUser.name,
      wasConfirmed: false,
      onConfirmed: async () => {
        await cancelConnection(item.id)
        setOutgoingItems((prev) => prev.filter((p) => p.id !== item.id))
      },
    })
  }

  const requestCancelHostedBooking = (item: ConfirmedBooking) => {
    setCancelTarget({
      id: item.id,
      name: item.otherUser.name,
      wasConfirmed: true,
      onConfirmed: async () => {
        await cancelConnection(item.id)
        setHostedBookings((prev) => prev.filter((p) => p.id !== item.id))
      },
    })
  }

  const requestCancelTrip = (item: ConfirmedBooking) => {
    setCancelTarget({
      id: item.id,
      name: item.otherUser.name,
      wasConfirmed: true,
      onConfirmed: async () => {
        await cancelConnection(item.id)
        setTrips((prev) => prev.filter((p) => p.id !== item.id))
      },
    })
  }

  const performCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelTarget.onConfirmed()
      toast.success(cancelTarget.wasConfirmed ? `Cancelled your booking with ${cancelTarget.name}` : `Cancelled your request to ${cancelTarget.name}`)
      setCancelTarget(null)
    } catch {
      toast.error(cancelTarget.wasConfirmed ? 'Failed to cancel booking' : 'Failed to cancel request')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return date.toLocaleDateString()
  }

  const groupTabClass = (active: boolean) =>
    `px-4 py-2 font-bold transition-colors relative flex items-center gap-2 ${active ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`

  const subTabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors relative flex items-center gap-2 ${active ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`

  return (
    <main className="p-3 max-w-7xl mx-auto space-y-4 fade-in">
      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmAction.type === 'approve' ? 'Approve Booking' : 'Reject Booking Request'}
            </h3>
            <p className="text-gray-600 mb-4">
              {confirmAction.type === 'approve'
                ? `Approve the booking request from ${confirmAction.item.requester.name}? Their email will be shared with you.`
                : `Reject the booking request from ${confirmAction.item.requester.name}?`}
            </p>
            {confirmAction.item.requester.linkedinUrl && (
              <div className="mb-3 p-2.5 bg-blue-50 rounded-lg">
                <a
                  href={confirmAction.item.requester.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  Review LinkedIn Profile
                </a>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.type === 'approve' ? handleApprove : handleReject}
                className={`px-6 py-2 rounded-lg font-bold ${confirmAction.type === 'approve'
                  ? 'bg-primary text-black hover:bg-primary-dark'
                  : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
              >
                {confirmAction.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {cancelTarget.wasConfirmed ? 'Cancel Booking' : 'Cancel Request'}
            </h3>
            <p className="text-gray-600 mb-4">
              {cancelTarget.wasConfirmed
                ? `Cancel your confirmed booking with ${cancelTarget.name}? They'll be notified by email.`
                : `Withdraw your booking request to ${cancelTarget.name}?`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
              >
                Never mind
              </button>
              <button
                onClick={performCancel}
                disabled={cancelling}
                className="px-6 py-2 rounded-lg font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : cancelTarget.wasConfirmed ? 'Cancel Booking' : 'Withdraw Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-2">Manage your booking requests and contacts</p>
        </div>
      </div>

      {/* Top-level: Hosting vs Traveling */}
      <div className="flex gap-2 border-b-2 border-gray-200">
        <button onClick={() => setActiveGroup('hosting')} className={groupTabClass(activeGroup === 'hosting')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Hosting
          {pendingItems.length > 0 && (
            <span className="bg-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingItems.length}
            </span>
          )}
          {activeGroup === 'hosting' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button onClick={() => setActiveGroup('traveling')} className={groupTabClass(activeGroup === 'traveling')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Traveling
          {outgoingItems.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {outgoingItems.length}
            </span>
          )}
          {activeGroup === 'traveling' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Sub-tabs for the active group */}
      {activeGroup === 'hosting' ? (
        <div className="flex gap-2">
          <button onClick={() => setHostingTab('requests')} className={subTabClass(hostingTab === 'requests')}>
            Booking Requests
            {pendingItems.length > 0 && (
              <span className="bg-primary text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingItems.length}</span>
            )}
          </button>
          <button onClick={() => setHostingTab('guests')} className={subTabClass(hostingTab === 'guests')}>
            Upcoming Guests
            {hostedBookings.length > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{hostedBookings.length}</span>
            )}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setTravelTab('requests')} className={subTabClass(travelTab === 'requests')}>
            My Requests
            {outgoingItems.length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{outgoingItems.length}</span>
            )}
          </button>
          <button onClick={() => setTravelTab('trips')} className={subTabClass(travelTab === 'trips')}>
            Upcoming Trips
            {trips.length > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{trips.length}</span>
            )}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin h-10 w-10 text-primary mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        ) : error ? (
          <div className="alert-error">
            <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        ) : activeGroup === 'hosting' && hostingTab === 'requests' ? (
          <PendingRequestsList
            items={pendingItems}
            processingId={processingId}
            celebratingIds={celebratingIds}
            onApprove={handleApproveDirectly}
            onReject={(item) => setConfirmAction({ type: 'reject', item })}
            formatDate={formatDate}
          />
        ) : activeGroup === 'hosting' && hostingTab === 'guests' ? (
          <ConfirmedBookingsList
            items={hostedBookings}
            emptyTitle="No upcoming guests"
            emptySubtitle="Guests you've approved to stay with you will appear here"
            formatDate={formatDate}
            onCancel={requestCancelHostedBooking}
          />
        ) : activeGroup === 'traveling' && travelTab === 'requests' ? (
          <OutgoingRequestsList items={outgoingItems} formatDate={formatDate} onCancel={requestCancelOutgoing} />
        ) : (
          <ConfirmedBookingsList
            items={trips}
            emptyTitle="No upcoming trips"
            emptySubtitle="Bookings you've made that get approved will appear here"
            formatDate={formatDate}
            onCancel={requestCancelTrip}
          />
        )}
      </div>
    </main>
  )
}

export default function RequestsPage() {
  return (
    <AuthGuard>
      <RequestsContent />
    </AuthGuard>
  )
}
