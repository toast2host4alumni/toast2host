type Uni = { name: string; state?: string | null; country?: string; external_id?: string | null }

const universitiesResolvers = {
  Query: {
    universitiesUS: async (_parent: unknown, args: { q?: string | null }) => {
      const q = args?.q ? `&name=${encodeURIComponent(args.q)}` : ''
      const url = `https://universities.hipolabs.com/search?country=United%20States${q}`
      try {
        const res = await fetch(url)
        const data = (await res.json()) as any[]
        const list: Uni[] = data.slice(0, 20).map((u) => ({
          name: u.name,
          state: u['state-province'] || null,
          country: u.country,
          external_id: u.alpha_two_code || null,
        }))
        return list
      } catch {
        return []
      }
    },
  },
}

export default universitiesResolvers
