import { z } from 'zod'

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
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  location_scope: z.enum(['city', 'state', 'country']).optional(),
  batch_year: z.number().int().min(1900, 'Batch year must be 1900 or later').max(2100, 'Batch year cannot exceed 2100'),
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

