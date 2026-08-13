import { z } from 'zod'

export const searchParamsSchema = z.object({
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  scope: z.enum(['city', 'state', 'country']).optional(),
  university: z.string().optional(),
  universities: z.array(z.string()).optional(),
  batch_year: z.number().int().optional(),
  sort: z.enum(['proximity', 'recent', 'name']).optional(),
  connected_only: z.boolean().optional(),
  hosts_only: z.boolean().optional(),
  travel_date_from: z.string().optional(),
  travel_date_to: z.string().optional(),
  guests: z.number().int().min(1).optional(),
  name: z.string().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
})

export type SearchParams = z.infer<typeof searchParamsSchema>

