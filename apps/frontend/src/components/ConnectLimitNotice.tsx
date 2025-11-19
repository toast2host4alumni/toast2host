import React from 'react'

export interface ConnectLimitNoticeProps {
  limit?: number
  onDismiss?: () => void
}

export default function ConnectLimitNotice({ limit = 10, onDismiss }: ConnectLimitNoticeProps) {
  return (
    <div className="alert-warning flex items-start gap-3">
      <div className="flex-shrink-0">
        <svg
          className="h-6 w-6 text-amber-700"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-amber-900 mb-1">Daily connection limit reached</h3>
        <p className="text-sm text-amber-800 leading-relaxed">
          You've reached your daily limit of {limit} connection{limit !== 1 ? 's' : ''}. Please try again tomorrow, or
          contact support to upgrade your plan for more connections.
        </p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 text-amber-700 hover:text-amber-900 transition-colors p-1 rounded-lg hover:bg-amber-100"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
