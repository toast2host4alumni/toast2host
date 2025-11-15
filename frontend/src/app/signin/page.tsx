'use client'

import React from 'react'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'

export default function SignInPage() {
  const onGoogleSignIn = () => {
    const redirect = `${window.location.origin}/auth/callback`
    const url = `${STRAPI_URL}/api/connect/google?redirect=${encodeURIComponent(redirect)}`
    window.location.href = url
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <button
        onClick={onGoogleSignIn}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        Continue with Google
      </button>
    </main>
  )
}

