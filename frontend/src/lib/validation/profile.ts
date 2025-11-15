import { z } from 'zod'

export const profileSchema = z.object({
  university_name: z.string().min(1, 'University is required'),
  linkedin_url: z.string().url('Valid LinkedIn URL required'),
  location_text: z.string().min(1, 'Location is required'),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  location_scope: z.enum(['city', 'state', 'country']).optional(),
  batch_year: z
    .number()
    .int()
    .min(1900)
    .max(2100)
    .optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

