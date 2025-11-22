'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'

export type LocationValue = {
  location_text: string
  location_lat?: number
  location_lng?: number
  location_scope?: 'city' | 'state' | 'country'
}

export interface LocationComboboxProps {
  value?: LocationValue
  onChange: (v: LocationValue) => void
  label?: string
}

export default function LocationCombobox({ value, onChange, label = 'Location' }: LocationComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (!inputRef.current || typeof window === 'undefined') return

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn('Google Maps API key not configured')
      return
    }

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return

      // Using old Autocomplete API (still supported, just deprecated for new customers)
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['(regions)'],
        fields: ['address_components', 'geometry', 'name', 'formatted_address'],
      })

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (!place || !place.geometry) return

        const lat = place.geometry.location?.lat()
        const lng = place.geometry.location?.lng()

        let scope: 'city' | 'state' | 'country' = 'city'
        const addressComponents = place.address_components || []

        const hasCity = addressComponents.some((c) => c.types.includes('locality'))
        const hasState = addressComponents.some((c) => c.types.includes('administrative_area_level_1'))
        const hasCountry = addressComponents.some((c) => c.types.includes('country'))

        if (hasCity) scope = 'city'
        else if (hasState) scope = 'state'
        else if (hasCountry) scope = 'country'

        onChange({
          location_text: place.formatted_address || place.name || '',
          location_lat: lat,
          location_lng: lng,
          location_scope: scope,
        })
      })
    }

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => initAutocomplete()
      document.head.appendChild(script)
    } else if (window.google?.maps?.places) {
      initAutocomplete()
    }
  }, [onChange])

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onChange({
      location_text: '',
      location_lat: undefined,
      location_lng: undefined,
      location_scope: 'city',
    })
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 pr-10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          placeholder="Search city, state, or country..."
          defaultValue={value?.location_text || ''}
        />
        {value?.location_text && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear location"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">Start typing to search for a location</p>
    </div>
  )
}
