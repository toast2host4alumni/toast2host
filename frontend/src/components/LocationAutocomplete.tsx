'use client'

import React from 'react'

export type LocationValue = {
  location_text: string
  location_lat?: number
  location_lng?: number
  location_scope?: 'city' | 'state' | 'country'
}

export interface LocationAutocompleteProps {
  value?: LocationValue
  onChange: (v: LocationValue) => void
}

export default function LocationAutocomplete({ value, onChange }: LocationAutocompleteProps) {
  const v = value || { location_text: '', location_scope: 'city' as const }
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Location</label>
      <input
        className="w-full rounded-md border p-2"
        placeholder="City, State, Country"
        value={v.location_text}
        onChange={(e) => onChange({ ...v, location_text: e.target.value })}
      />
      <div className="flex gap-2">
        <select
          className="rounded-md border p-2"
          value={v.location_scope || 'city'}
          onChange={(e) => onChange({ ...v, location_scope: e.target.value as LocationValue['location_scope'] })}
        >
          <option value="city">City</option>
          <option value="state">State</option>
          <option value="country">Country</option>
        </select>
        <input
          className="w-full rounded-md border p-2"
          placeholder="Latitude (optional)"
          inputMode="decimal"
          value={v.location_lat ?? ''}
          onChange={(e) => onChange({ ...v, location_lat: e.target.value ? Number(e.target.value) : undefined })}
        />
        <input
          className="w-full rounded-md border p-2"
          placeholder="Longitude (optional)"
          inputMode="decimal"
          value={v.location_lng ?? ''}
          onChange={(e) => onChange({ ...v, location_lng: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
    </div>
  )
}

