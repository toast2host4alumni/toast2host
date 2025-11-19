'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { onboardingSchema, type OnboardingInput } from '@/lib/validation/profile'
import UniversityCombobox from '@/components/UniversityCombobox'
import LocationCombobox, { type LocationValue } from '@/components/LocationCombobox'
import LinkedInInput from '@/components/LinkedInInput'
import { updateMyProfile } from '@/lib/graphql/operations'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { useCurrentUser, useInvalidateCurrentUser } from '@/hooks/useCurrentUser'

function OnboardingContent() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const invalidateUser = useInvalidateCurrentUser()
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({ resolver: zodResolver(onboardingSchema) })

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load existing profile data (from Google OAuth)
  useEffect(() => {
    if (!userLoading && user?.profile && !initialDataLoaded) {
      if (user.profile.first_name) setValue('first_name', user.profile.first_name)
      if (user.profile.last_name) setValue('last_name', user.profile.last_name)
      if (user.profile.profile_photo_url) setValue('profile_photo_url', user.profile.profile_photo_url)
      setInitialDataLoaded(true)
    }
  }, [user, userLoading, setValue, initialDataLoaded])

  const onUniversityChange = (name: string) => setValue('university_name', name)
  const loc = watch(['location_text', 'location_lat', 'location_lng', 'location_scope'])
  const locationValue: LocationValue = {
    location_text: loc[0] || '',
    location_lat: loc[1],
    location_lng: loc[2],
    location_scope: loc[3],
  }
  const onLocationChange = (v: LocationValue) => {
    setValue('location_text', v.location_text)
    setValue('location_lat', v.location_lat)
    setValue('location_lng', v.location_lng)
    setValue('location_scope', v.location_scope)
  }

  const onSubmit = async (data: OnboardingInput) => {
    // Remove agree_to_terms from profile data before sending to API
    const { agree_to_terms, ...profileData } = data
    await updateMyProfile({ ...profileData, onboarding_completed: true })
    await invalidateUser()
    router.replace('/search')
  }

  // Show loading state while mounting or loading user data
  if (!isMounted || userLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" suppressHydrationWarning>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" suppressHydrationWarning>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl w-full space-y-8 fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl mb-2">
            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900">Complete your profile</h1>
          <p className="text-gray-600 text-lg">Help fellow alumni find and connect with you</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">First Name</label>
              <input
                className="w-full"
                placeholder="John"
                {...register('first_name')}
              />
              {errors.first_name && (
                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.first_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Last Name</label>
              <input
                className="w-full"
                placeholder="Doe"
                {...register('last_name')}
              />
              {errors.last_name && (
                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <UniversityCombobox value={watch('university_name')} onChange={onUniversityChange} />
            {errors.university_name && (
              <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.university_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <LocationCombobox value={locationValue} onChange={onLocationChange} />
            {errors.location_text && (
              <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.location_text.message}
              </p>
            )}
          </div>

          <LinkedInInput
            value={watch('linkedin_url')}
            onChange={(value) => setValue('linkedin_url', value)}
            error={errors.linkedin_url?.message}
          />

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Batch Year (optional)</label>
            <input
              className="w-full"
              type="number"
              placeholder="YYYY"
              {...register('batch_year', { valueAsNumber: true })}
            />
            {errors.batch_year && (
              <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.batch_year.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="border-2 border-gray-200 rounded-lg px-4 py-3.5 bg-white hover:border-gray-300 transition-colors">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agree_to_terms"
                  className="mt-0.5 cursor-pointer"
                  {...register('agree_to_terms')}
                />
                <label
                  htmlFor="agree_to_terms"
                  className="text-sm text-gray-700 select-none cursor-pointer !leading-6 !mb-0 block"
                >
                  I agree to the{' '}
                  <a
                    href="https://toast2host.net/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline !min-h-0 inline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://toast2host.net/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline !min-h-0 inline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
            {errors.agree_to_terms && (
              <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.agree_to_terms.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="bg-primary text-black font-bold px-9 py-3 rounded-lg shadow-md hover:shadow-lg hover:bg-primary-dark transition-all w-full inline-flex items-center justify-center rounded-xl px-6 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                Save and continue
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <AuthGuard requireOnboarding={false}>
      <OnboardingContent />
    </AuthGuard>
  )
}
