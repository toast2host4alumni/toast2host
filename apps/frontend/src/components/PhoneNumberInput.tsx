'use client'

import { useEffect, useState } from 'react'
import {
  AsYouType,
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js'

interface PhoneNumberInputProps {
  value?: string // stored/emitted as E.164, e.g. "+15551234567"
  onChange: (value: string) => void
  error?: string
}

const PRIORITY_COUNTRIES: CountryCode[] = ['US', 'IN', 'GB', 'CA', 'AU']
const DEFAULT_COUNTRY: CountryCode = 'US'

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null

function countryLabel(code: CountryCode) {
  const name = regionNames?.of(code) || code
  // Calling code goes first so it stays visible even when the closed
  // <select> truncates a long country name.
  return `+${getCountryCallingCode(code)} ${name}`
}

const ALL_CODES = getCountries()
const PRIORITY = PRIORITY_COUNTRIES.filter((c) => ALL_CODES.includes(c))
const REST = ALL_CODES
  .filter((c) => !PRIORITY_COUNTRIES.includes(c))
  .sort((a, b) => (regionNames?.of(a) || a).localeCompare(regionNames?.of(b) || b))

export default function PhoneNumberInput({ value = '', onChange, error }: PhoneNumberInputProps) {
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [nationalInput, setNationalInput] = useState('')
  const [hasInitialized, setHasInitialized] = useState(false)

  // Split an incoming E.164 value (e.g. loaded from the saved profile) into
  // country + national number once, on first load.
  useEffect(() => {
    if (hasInitialized) return
    if (value) {
      const parsed = parsePhoneNumberFromString(value)
      if (parsed?.country) {
        setCountry(parsed.country)
        setNationalInput(new AsYouType(parsed.country).input(parsed.nationalNumber))
      }
    }
    setHasInitialized(true)
  }, [value, hasInitialized])

  const commit = (nextCountry: CountryCode, rawInput: string) => {
    setNationalInput(new AsYouType(nextCountry).input(rawInput))
    if (!rawInput.trim()) {
      onChange('')
      return
    }
    const parsed = parsePhoneNumberFromString(rawInput, nextCountry)
    // Pass the raw (unparsed) input through when it isn't a valid number yet,
    // rather than clearing it - that way the zod schema's isValidPhoneNumber
    // check actually catches it and blocks submission instead of the bad
    // input silently vanishing.
    onChange(parsed?.isValid() ? parsed.number : rawInput)
  }

  const isIncomplete = nationalInput.trim().length > 0 && !value.startsWith('+')

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">Phone Number (optional)</label>
      <div className="flex gap-2">
        <select
          className="w-44 shrink-0"
          value={country}
          onChange={(e) => {
            const next = e.target.value as CountryCode
            setCountry(next)
            commit(next, nationalInput)
          }}
        >
          {PRIORITY.map((c) => (
            <option key={c} value={c}>{countryLabel(c)}</option>
          ))}
          <option disabled>──────────</option>
          {REST.map((c) => (
            <option key={c} value={c}>{countryLabel(c)}</option>
          ))}
        </select>
        <input
          className="w-full"
          type="tel"
          placeholder="(555) 123-4567"
          value={nationalInput}
          onChange={(e) => commit(country, e.target.value)}
        />
      </div>

      {!error && isIncomplete && (
        <p className="text-xs text-amber-600">Enter a complete phone number</p>
      )}
      {!error && !isIncomplete && (
        <p className="text-xs text-gray-500">...for faster connectivity</p>
      )}
      {error && (
        <p className="text-red-600 text-sm font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
