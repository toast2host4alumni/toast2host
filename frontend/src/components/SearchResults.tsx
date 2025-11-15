import React, { useState } from 'react'
import { createConnection } from '@/lib/graphql/operations'
import ConnectLimitNotice from './ConnectLimitNotice'

type Item = {
  userId: string
  name: string
  university?: string | null
  location?: string | null
  connectionStatus: 'none' | 'pending' | 'connected' | string
}

export interface SearchResultsProps {
  items: Item[]
  onAfterConnect?: () => void
}

export default function SearchResults({ items, onAfterConnect }: SearchResultsProps) {
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  return (
    <div className="space-y-4">
      {limitReached && (
        <ConnectLimitNotice onDismiss={() => setLimitReached(false)} />
      )}
      <ul className="divide-y">
      {items.map((it) => (
        <li key={it.userId} className="py-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{it.name}</div>
            <div className="text-sm text-gray-600">{it.university} • {it.location}</div>
            {it.connectionStatus === 'connected' && it['email'] && (
              <div className="text-sm text-gray-800">Email: {String((it as any).email)}</div>
            )}
          </div>
          <div>
            {it.connectionStatus === 'connected' ? (
              <span className="text-green-700 text-sm">Connected</span>
            ) : it.connectionStatus === 'pending' ? (
              <span className="text-amber-700 text-sm">Pending</span>
            ) : (
              <button
                className="rounded-md bg-primary px-3 py-1.5 text-white text-sm"
                onClick={async () => {
                  setError(null)
                  setLimitReached(false)
                  try {
                    await createConnection(it.userId)
                    onAfterConnect?.()
                  } catch (e: any) {
                    const msg = e?.message || ''
                    if (String(msg).includes('DAILY_CAP_REACHED')) {
                      setLimitReached(true)
                    } else {
                      setError('Unable to connect')
                    }
                  }
                }}
              >
                Connect
              </button>
            )}
          </div>
        </li>
      ))}
        {error && <li className="py-2 text-sm text-red-600">{error}</li>}
      </ul>
    </div>
  )
}
