'use client'

import React, { useEffect, useState } from 'react'
import { approveConnection, getMyPendingConnections, rejectConnection } from '@/lib/graphql/operations'

type Conn = { id: string; status: string }

export default function RequestsPage() {
  const [items, setItems] = useState<Conn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const list = await getMyPendingConnections()
      setItems(list)
    } catch (e: any) {
      setError('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Pending requests</h1>
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No pending requests.</div>
      ) : (
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.id} className="py-3 flex items-center justify-between">
              <div>Request #{it.id}</div>
              <div className="flex gap-2">
                <button className="rounded-md border px-3 py-1.5 text-sm" onClick={async () => { await approveConnection(it.id); load() }}>Approve</button>
                <button className="rounded-md border px-3 py-1.5 text-sm" onClick={async () => { await rejectConnection(it.id); load() }}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

