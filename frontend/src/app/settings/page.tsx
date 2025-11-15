'use client'

import React, { useEffect, useState } from 'react'
import { createPrivacyRequest, getMyPrivacyRequests } from '@/lib/graphql/operations'

type Req = { id: string; type: 'deletion' | 'export'; status: string; created_at: string; completed_at?: string | null }

export default function SettingsPage() {
  const [items, setItems] = useState<Req[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const list = await getMyPrivacyRequests()
    setItems(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const submit = async (type: 'deletion' | 'export') => {
    setNotice(null)
    await createPrivacyRequest(type)
    setNotice(`${type === 'export' ? 'Data export' : 'Account deletion'} request submitted`)
    load()
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Privacy</h2>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => submit('export')}>Request Data Export</button>
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => submit('deletion')}>Request Account Deletion</button>
        </div>
        {notice && <p className="text-green-700 text-sm">{notice}</p>}
        <div>
          <h3 className="text-sm font-medium mt-4">Your Privacy Requests</h3>
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-gray-600">No requests yet.</div>
          ) : (
            <ul className="text-sm divide-y">
              {items.map((it) => (
                <li key={it.id} className="py-2 flex items-center justify-between">
                  <div>#{it.id} • {it.type} • {it.status}</div>
                  <div>{new Date(it.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

