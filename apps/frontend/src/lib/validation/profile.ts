import { z } from 'zod'
import { isValidPhoneNumber } from 'libphonenumber-js'

export const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  profile_photo_url: z.string().optional(),
  university_name: z.string().min(1, 'University is required'),
  linkedin_url: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        // Just check if it's a valid LinkedIn URL
        return val.toLowerCase().includes('linkedin.com')
      },
      { message: 'Please enter a valid LinkedIn URL (must contain linkedin.com)' }
    )
    .or(z.literal('')),
  location_text: z.string().min(1, 'Location is required'),
  // .nullable() matters here specifically: unlike every other field below (which are
  // conditionally set with `if (p.field) setValue(...)`, skipping null entirely),
  // ProfilePage sets these two unconditionally from the API, which returns null (not
  // undefined) when a profile has no location coordinates saved yet.
  location_lat: z.number().optional().nullable(),
  location_lng: z.number().optional().nullable(),
  location_scope: z.enum(['city', 'state', 'country']).optional(),
  batch_year: z.number({ error: 'Batch year is required' }).int().min(1900, 'Batch year must be 1900 or later').max(2100, 'Batch year cannot exceed 2100'),
  host_mode: z.boolean().optional(),
  // .nullable() so clearing the field can send an explicit `null` to the backend
  // (an `undefined` value gets dropped entirely from the GraphQL request body,
  // which would leave a previously-set limit untouched instead of clearing it).
  max_guests: z.number().int().min(1, 'Must be at least 1').max(50, 'Max guests cannot exceed 50').optional().nullable(),
  phone_number: z
    .string()
    .optional()
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: 'Please enter a valid phone number',
    }),
  profile_visibility: z.enum(['everyone', 'same_university', 'same_batch']).optional(),
})

// Schema for onboarding - adds terms acceptance requirement
// Note: linkedin_url is optional, just not shown in onboarding UI
export const onboardingSchema = profileSchema.extend({
  agree_to_terms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
})

// Schema for edit profile - university still required but can be optional for partial updates
export const editProfileSchema = profileSchema.partial().extend({
  university_name: z.string().min(1, 'University is required'),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
