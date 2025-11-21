import { useEffect, Suspense } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setAuthToken } from '@/lib/auth'

function AuthCallbackContent() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get Google's access_token from Strapi redirect
        const accessToken = searchParams.get('access_token')

        if (!accessToken) {
          navigate('/signin', { replace: true })
          return
        }

        // Fetch Google user info
        const googleUserRes = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
        )
        const googleUser = googleUserRes.ok ? await googleUserRes.json() : null

        // Call Strapi's callback endpoint to exchange for JWT
        const STRAPI_URL = import.meta.env.VITE_STRAPI_URL

        if (!STRAPI_URL) {
          throw new Error('VITE_STRAPI_URL is not defined')
        }

        const response = await fetch(
          `${STRAPI_URL}/api/auth/google/callback?access_token=${accessToken}`
        )

        if (!response.ok) {
          throw new Error('Failed to authenticate')
        }

        const data = await response.json()

        if (data.jwt) {
          setAuthToken(data.jwt)

          // Auto-create/update profile with Google data
          if (googleUser) {
            try {
              // Parse name - try given_name/family_name first, fallback to splitting "name" field
              let firstName = googleUser.given_name
              let lastName = googleUser.family_name

              // If given_name or family_name is missing, split the "name" field
              if (!firstName || !lastName) {
                if (googleUser.name) {
                  const nameParts = googleUser.name.trim().split(' ')
                  if (!firstName) firstName = nameParts[0] || ''
                  if (!lastName) lastName = nameParts.slice(1).join(' ') || ''
                } else {
                  firstName = firstName || ''
                  lastName = lastName || ''
                }
              }

              const profileInput = {
                first_name: firstName,
                last_name: lastName,
                profile_photo_url: googleUser.picture || '',
              }
              console.log('Google user data:', googleUser)
              console.log('Updating profile with:', profileInput)

              const profileRes = await fetch(`${STRAPI_URL}/graphql`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${data.jwt}`,
                },
                body: JSON.stringify({
                  query: `mutation UpdateMyProfile($input: UpdateProfileInput!) {
                    updateMyProfile(input: $input) { profile { id first_name last_name } }
                  }`,
                  variables: {
                    input: profileInput,
                  },
                }),
              })
              const profileResult = await profileRes.json()
              console.log('Profile update result:', profileResult)
            } catch (profileError) {
              console.error('Failed to update profile with Google data:', profileError)
            }
          }

          navigate('/search', { replace: true })
        } else {
          throw new Error('No JWT received')
        }
      } catch (error) {
        console.error('Auth error:', error)
        navigate('/signin', { replace: true })
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-lg font-semibold text-gray-900">Signing you in...</p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading...</main>}>
      <AuthCallbackContent />
    </Suspense>
  )
}
