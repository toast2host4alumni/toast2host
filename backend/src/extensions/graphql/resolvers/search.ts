type Args = {
  location?: string | null
  lat?: number | null
  lng?: number | null
  scope?: 'city' | 'state' | 'country' | null
  university?: string | null
  batch_year?: number | null
  sort?: 'proximity' | 'recent' | 'name' | null
  not_connected_only?: boolean | null
  name?: string | null
  page?: number | null
  pageSize?: number | null
}

const toNumber = (v: any) => (typeof v === 'number' ? v : v ? Number(v) : undefined)

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8 // miles
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const searchResolvers = {
  Query: {
    searchUsers: async (_parent: unknown, rawArgs: Args, ctx: any) => {
      const args: Args = {
        ...rawArgs,
        page: rawArgs.page ?? 1,
        pageSize: Math.min(Math.max(rawArgs.pageSize ?? 20, 1), 50),
      }

      const filters: any = {}
      if (args.university) filters.university_name = { $eqi: args.university }
      if (args.batch_year) filters.batch_year = { $eq: args.batch_year }
      if (args.name) filters.name = { $containsi: args.name }

      // Location filters
      const lat = toNumber(args.lat)
      const lng = toNumber(args.lng)
      if ((args.scope === 'city' || !args.scope) && typeof lat === 'number' && typeof lng === 'number') {
        const miles = 25
        const dLat = miles / 69 // approx
        const dLng = miles / (Math.cos((lat * Math.PI) / 180) * 69)
        filters.location_lat = { $gte: lat - dLat, $lte: lat + dLat }
        filters.location_lng = { $gte: lng - dLng, $lte: lng + dLng }
      } else if ((args.scope === 'state' || args.scope === 'country') && args.location) {
        filters.location_text = { $containsi: args.location }
      }

      // Base query with populate to get user relation
      const baseQuery: any = {
        filters,
        populate: { user: { fields: ['id', 'email', 'username'] } },
      }

      // Sorting strategy
      let records: any[] = []
      if (args.sort === 'recent' || args.sort === 'name' || !args.sort || !lat || !lng) {
        // Use DB sort for recent/name or if proximity not possible
        const sortField = args.sort === 'name' ? 'name:asc' : 'updatedAt:desc'
        const page = args.page || 1
        const pageSize = args.pageSize || 20
        records = await strapi.entityService.findMany('api::user-profile.user-profile', {
          ...baseQuery,
          sort: sortField,
          page,
          pageSize,
        })
      } else {
        // Proximity sort: fetch bounding box set then sort in-memory and paginate
        const raw = await strapi.entityService.findMany('api::user-profile.user-profile', {
          ...baseQuery,
          page: 1,
          pageSize: 200, // cap for MVP
        })
        const withDist = raw.map((p: any) => ({
          ...p,
          _dist: typeof p.location_lat === 'number' && typeof p.location_lng === 'number'
            ? haversine(lat!, lng!, p.location_lat, p.location_lng)
            : Number.POSITIVE_INFINITY,
        }))
        withDist.sort((a: any, b: any) => a._dist - b._dist)
        const start = ((args.page || 1) - 1) * (args.pageSize || 20)
        const end = start + (args.pageSize || 20)
        records = withDist.slice(start, end)
      }

      // Build connection status map
      const actorId = ctx?.state?.user?.id
      let connectionMap = new Map<number, string>()
      if (actorId) {
        const conns = await strapi.entityService.findMany('api::connection.connection', {
          filters: {
            $or: [{ actor_user: actorId }, { target_user: actorId }],
          },
          page: 1,
          pageSize: 500,
        })
        for (const c of conns) {
          const otherId = c.actor_user?.id === actorId ? c.target_user?.id : c.actor_user?.id
          if (!otherId) continue
          const prev = connectionMap.get(otherId)
          if (c.status === 'connected') connectionMap.set(otherId, 'connected')
          else if (!prev) connectionMap.set(otherId, c.status)
        }
      }

      let results = records.map((p: any) => {
        const uid = p.user?.id
        const status = uid ? connectionMap.get(uid) || 'none' : 'none'
        return {
          userId: String(uid || ''),
          name: p.name || p.user?.username || p.user?.email || 'Unknown',
          university: p.university_name,
          location: p.location_text,
          connectionStatus: status,
          email: status === 'connected' ? p.user?.email || null : null,
        }
      })

      if (args.not_connected_only && actorId) {
        results = results.filter((r) => r.connectionStatus === 'none')
      }

      return results
    },
  },
}

export default searchResolvers
