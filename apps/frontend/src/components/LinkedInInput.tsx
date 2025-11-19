'use client'

import React, { useState, useEffect } from 'react'

interface LinkedInInputProps {
  value?: string
  onChange: (value: string) => void
  error?: string
}

const LINKEDIN_PREFIX = 'https://linkedin.com'

/**
 * Smart LinkedIn URL Input Component
 *
 * Accepts multiple formats:
 * - Full URL: https://linkedin.com/in/username
 * - Protocol-less: linkedin.com/in/username
 * - Path only: /in/username
 * - Username only: in/username
 *
 * Always stores and displays the full URL
 */
export default function LinkedInInput({ value = '', onChange, error }: LinkedInInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Initialize input value from prop
  useEffect(() => {
    if (value) {
      // Strip the prefix for display
      const displayValue = value.replace(/^https?:\/\/(www\.)?linkedin\.com/i, '')
      setInputValue(displayValue)
    } else {
      setInputValue('')
    }
  }, [value])

  const normalizeLinkedInUrl = (input: string): string => {
    if (!input || input.trim() === '') {
      return ''
    }

    let normalized = input.trim()

    // Remove any protocol (http://, https://)
    normalized = normalized.replace(/^https?:\/\//i, '')

    // Remove www. prefix
    normalized = normalized.replace(/^www\./i, '')

    // Remove linkedin.com if present
    normalized = normalized.replace(/^linkedin\.com/i, '')

    // Ensure it starts with /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized
    }

    // If it's just "/" or empty after normalization, return empty
    if (normalized === '/' || normalized.trim() === '') {
      return ''
    }

    // Return full URL
    return LINKEDIN_PREFIX + normalized
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setInputValue(input)

    // Normalize and update parent
    const normalized = normalizeLinkedInUrl(input)
    onChange(normalized)
  }

  const handleBlur = () => {
    setIsFocused(false)

    // Re-normalize on blur for consistency
    if (inputValue) {
      const normalized = normalizeLinkedInUrl(inputValue)
      if (normalized) {
        const displayValue = normalized.replace(/^https?:\/\/(www\.)?linkedin\.com/i, '')
        setInputValue(displayValue)
      }
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        LinkedIn URL (optional)
      </label>

      <div className="relative">
        {/* Prefix label */}
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
          <span className="bg-gray-100 text-gray-600 text-sm px-3 h-full flex items-center rounded-l-lg border-2 border-r-0 border-gray-300">
            https://linkedin.com
          </span>
        </div>

        {/* Input field */}
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder="/in/username"
          className="w-full pl-[165px] pr-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Helper text */}
      {!error && !isFocused && !inputValue && (
        <p className="text-xs text-gray-500">
          Enter your LinkedIn path (e.g., /in/yourname) or paste the full URL
        </p>
      )}

      {/* Show full URL preview when focused or has value */}
      {(isFocused || inputValue) && !error && (
        <p className="text-xs text-gray-600 flex items-center gap-1">
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {value || `${LINKEDIN_PREFIX}${inputValue || '/in/username'}`}
        </p>
      )}

      {/* Error message */}
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
