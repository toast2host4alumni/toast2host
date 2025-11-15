'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileInput } from '@/lib/validation/profile'
import UniversitySelect from '@/components/UniversitySelect'
import LocationAutocomplete, { type LocationValue } from '@/components/LocationAutocomplete'
import { updateMyProfile } from '@/lib/graphql/operations'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema) })

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

  const onSubmit = async (data: ProfileInput) => {
    await updateMyProfile(data)
    router.replace('/search')
  }

  return (
    <main className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Complete your profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <UniversitySelect onChange={onUniversityChange} />
        {errors.university_name && <p className="text-red-600 text-sm">{errors.university_name.message}</p>}

        <div className="space-y-2">
          <label className="block text-sm font-medium">LinkedIn URL</label>
          <input className="w-full rounded-md border p-2" placeholder="https://linkedin.com/in/username" {...register('linkedin_url')} />
          {errors.linkedin_url && <p className="text-red-600 text-sm">{errors.linkedin_url.message}</p>}
        </div>

        <LocationAutocomplete value={locationValue} onChange={onLocationChange} />
        {errors.location_text && <p className="text-red-600 text-sm">{errors.location_text.message}</p>}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Batch Year (optional)</label>
          <input className="w-full rounded-md border p-2" type="number" placeholder="YYYY" {...register('batch_year', { valueAsNumber: true })} />
          {errors.batch_year && <p className="text-red-600 text-sm">{errors.batch_year.message}</p>}
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </main>
  )
}

