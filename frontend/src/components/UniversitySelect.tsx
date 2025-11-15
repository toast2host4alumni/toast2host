'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { graphqlClient } from '@/lib/graphql/client'

type University = { name: string; state?: string | null; country?: string; external_id?: string | null }

const UNIVERSITIES_US = `
  query UniversitiesUS($q: String) {
    universitiesUS(q: $q) { name state country external_id }
  }
` as const

export interface UniversitySelectProps {
  value?: string
  onChange: (name: string) => void
}

export default function UniversitySelect({ value, onChange }: UniversitySelectProps) {
  const [q, setQ] = useState('')
  const [options, setOptions] = useState<University[]>([])

  useEffect(() => {
    let canceled = false
    async function run() {
      try {
        const result = await graphqlClient
          .query<{ universitiesUS: University[] }, { q?: string }>(UNIVERSITIES_US, { q })
          .toPromise()
        if (!canceled) setOptions(result.data?.universitiesUS ?? [])
      } catch {
        if (!canceled) setOptions([])
      }
    }
    run()
    return () => {
      canceled = true
    }
  }, [q])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">University</label>
      <input
        className="w-full rounded-md border p-2"
        placeholder="Search university"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        className="w-full rounded-md border p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((u) => (
          <option key={`${u.name}-${u.state ?? ''}`} value={u.name}>
            {u.name}{u.state ? `, ${u.state}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
