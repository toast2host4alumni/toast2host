type Uni = { name: string; state?: string | null; country?: string; external_id?: string | null }

const universitiesResolvers = {
  Query: {
    universitiesUS: async (_parent: unknown, args: { q?: string | null }) => {
      try {
        // Build query filters
        const filters: any = {}

        if (args?.q) {
          filters.name = { $containsi: args.q }
        }

        // Query universities from Strapi database using global strapi
        const universities = await strapi.entityService.findMany('api::university.university', {
          filters,
          limit: 50,
          sort: { name: 'asc' },
        })

        const list: Uni[] = universities.map((u: any) => ({
          name: u.name,
          state: u.state_province || null,
          country: u.country,
          external_id: u.external_id || null,
        }))

        return list
      } catch (error) {
        console.error('Error fetching universities:', error)
        return []
      }
    },
  },
}

export default universitiesResolvers
