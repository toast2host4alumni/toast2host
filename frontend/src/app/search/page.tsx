'use client'

import React, { useMemo, useState } from 'react'
import UniversitySelect from '@/components/UniversitySelect'
import SearchResults from '@/components/SearchResults'
import { useSearch } from '@/hooks/useSearch'

export default function SearchPage() {
  const [location, setLocation] = useState('')
  const [scope, setScope] = useState<'city' | 'state' | 'country'>('city')
  const [university, setUniversity] = useState<string | undefined>(undefined)
  const [batchYear, setBatchYear] = useState<number | undefined>(undefined)
  const [sort, setSort] = useState<'proximity' | 'recent' | 'name'>('proximity')
  const [notConnectedOnly, setNotConnectedOnly] = useState(false)
  const [name, setName] = useState('')

  const params = useMemo(() => ({
    location: location || undefined,
    scope,
    university,
    batch_year: batchYear,
    sort,
    not_connected_only: notConnectedOnly || undefined,
    name: name || undefined,
  }), [location, scope, university, batchYear, sort, notConnectedOnly, name])

  const { data, fetchNextPage, hasNextPage, isFetching, refetch } = useSearch(params, 20)

  const items = (data?.pages ?? []).flatMap((p) => p.items)

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Search alumni</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1 space-y-3">
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input className="w-full rounded-md border p-2" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State, Country" />
          </div>
          <div>
            <label className="block text-sm font-medium">Scope</label>
            <select className="w-full rounded-md border p-2" value={scope} onChange={(e) => setScope(e.target.value as any)}>
              <option value="city">City</option>
              <option value="state">State</option>
              <option value="country">Country</option>
            </select>
          </div>
          <UniversitySelect value={university} onChange={setUniversity} />
          <div>
            <label className="block text-sm font-medium">Batch Year</label>
            <input className="w-full rounded-md border p-2" type="number" value={batchYear ?? ''} onChange={(e) => setBatchYear(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Name contains</label>
            <input className="w-full rounded-md border p-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Sort by</label>
            <select className="w-full rounded-md border p-2" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="proximity">Proximity</option>
              <option value="recent">Recent</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={notConnectedOnly} onChange={(e) => setNotConnectedOnly(e.target.checked)} /> Not connected only</label>
          <button onClick={() => refetch()} className="mt-2 rounded-md bg-primary px-3 py-1.5 text-white text-sm disabled:opacity-50" disabled={isFetching}>Search</button>
        </div>
        <div className="md:col-span-2">
          {isFetching && items.length === 0 ? (
            <div className="text-gray-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-gray-600">No results. Try broadening filters.</div>
          ) : (
            <>
              <SearchResults items={items} onAfterConnect={() => refetch()} />
              {hasNextPage && (
                <div className="mt-4">
                  <button onClick={() => fetchNextPage()} className="rounded-md border px-3 py-1.5 text-sm">Load more</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
