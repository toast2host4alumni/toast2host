'use client'

import React from 'react'

interface LinkedInInputProps {
  value?: string
  onChange: (value: string) => void
  error?: string
}

/**
 * Simple LinkedIn URL Input Component
 * Accepts and stores the full LinkedIn URL as entered by the user
 */
export default function LinkedInInput({ value = '', onChange, error }: LinkedInInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        LinkedIn URL (optional)
      </label>

      <input
        type="url"
        value={value}
        onChange={handleChange}
        placeholder="https://linkedin.com/in/yourname"
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
      />

      {/* Helper text */}
      {!error && !value && (
        <p className="text-xs text-gray-500">
          Enter your full LinkedIn profile
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
