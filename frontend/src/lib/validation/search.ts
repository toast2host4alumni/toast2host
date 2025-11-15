import { z } from 'zod'

export const searchParamsSchema = z.object({
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  scope: z.enum(['city', 'state', 'country']).optional(),
  university: z.string().optional(),
  batch_year: z.number().int().optional(),
  sort: z.enum(['proximity', 'recent', 'name']).optional(),
  not_connected_only: z.boolean().optional(),
  name: z.string().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
})

export type SearchParams = z.infer<typeof searchParamsSchema>

