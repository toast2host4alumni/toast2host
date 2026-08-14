type Args = {
  location?: string | null
  lat?: number | null
  lng?: number | null
  scope?: 'city' | 'state' | 'country' | null
  university?: string | null
  universities?: string[] | null
  batch_year?: number | null
  sort?: 'proximity' | 'recent' | 'name' | null
  connected_only?: boolean | null
  name?: string | null
  page?: number | null
  pageSize?: number | null
  hosts_only?: boolean | null
  guests?: number | null
}

const toNumber = (v: any) => (typeof v === 'number' ? v : v ? Number(v) : undefined)

// US state name to abbreviation mapping
const US_STATE_MAP: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
}

// Country name variations mapping (full name -> common variations)
const COUNTRY_MAP: Record<string, string[]> = {
  'United States': ['USA', 'US', 'United States', 'United States of America'],
  'United Kingdom': ['UK', 'GB', 'United Kingdom', 'Great Britain'],
  'Canada': ['Canada', 'CA'],
  'Australia': ['Australia', 'AU'],
  'India': ['India', 'IN'],
  'Germany': ['Germany', 'DE', 'Deutschland'],
  'France': ['France', 'FR'],
  'China': ['China', 'CN'],
  'Japan': ['Japan', 'JP'],
  'Brazil': ['Brazil', 'BR'],
  'Mexico': ['Mexico', 'MX'],
  'South Korea': ['South Korea', 'Korea', 'KR'],
  'Italy': ['Italy', 'IT'],
  'Spain': ['Spain', 'ES'],
  'Netherlands': ['Netherlands', 'NL'],
  'Switzerland': ['Switzerland', 'CH'],
  'Singapore': ['Singapore', 'SG'],
  'New Zealand': ['New Zealand', 'NZ'],
}

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

      // Only show profiles that have completed onboarding
      filters.onboarding_completed = true

      // Exclude the currently logged-in user from search results
      const actorId = ctx?.state?.user?.id
      if (actorId) {
        filters.user = { $ne: actorId }
      }

      // Handle university filters - support both single and multiple universities
      if (args.universities && args.universities.length > 0) {
        // Multiple universities - use $or with case-insensitive matching
        filters.$or = args.universities.map(uni => ({ university_name: { $eqi: uni } }))
      } else if (args.university) {
        // Single university for backwards compatibility
        filters.university_name = { $eqi: args.university }
      }

      if (args.batch_year) filters.batch_year = { $eq: args.batch_year }

      // Filter for hosts only
      if (args.hosts_only) {
        filters.host_mode = true
      }

      // Filter by guest capacity - a host who hasn't stated a capacity is treated as
      // unlimited (matching requestConnection's EXCEEDS_HOST_CAPACITY check, which only
      // rejects when max_guests is actually set), not excluded outright.
      if (args.guests) {
        const capacityFilter = {
          $or: [
            { max_guests: { $gte: args.guests } },
            { max_guests: { $null: true } },
          ],
        }
        filters.$and = filters.$and ? [...filters.$and, capacityFilter] : [capacityFilter]
      }

      // Location filters
      const lat = toNumber(args.lat)
      const lng = toNumber(args.lng)
      if ((args.scope === 'city' || !args.scope) && typeof lat === 'number' && typeof lng === 'number') {
        const miles = 25
        const dLat = miles / 69 // approx
        const dLng = miles / (Math.cos((lat * Math.PI) / 180) * 69)
        filters.location_lat = { $gte: lat - dLat, $lte: lat + dLat }
        filters.location_lng = { $gte: lng - dLng, $lte: lng + dLng }
      } else if (args.scope === 'state' && args.location) {
        // State search: match state name or abbreviation in location_text
        // Format: "City, STATE_ABBREV, Country" (e.g., "San Francisco, CA, USA")
        // Google Places sends "California, USA" but DB has "City, CA, USA"

        // Extract state name from location (remove country)
        const locationParts = args.location.split(',').map(s => s.trim())
        const stateName = locationParts[0] // "California" from "California, USA"

        // Get state abbreviation if available
        const stateAbbrev = US_STATE_MAP[stateName]

        // Search for both full state name and abbreviation
        filters.$or = [
          { location_text: { $containsi: stateName } },  // "California" or "New York"
          ...(stateAbbrev ? [{ location_text: { $containsi: `, ${stateAbbrev},` } }] : [])  // ", CA," or ", NY,"
        ]
      } else if (args.scope === 'country' && args.location) {
        // Country search: match country name or common variations
        // Google Places sends "United States" but DB might have "USA"
        // Extract country name from location (e.g., "United States" from "United States")
        const countryName = args.location.split(',')[0].trim()

        // Get country variations from map, or use the country name as-is
        const countryVariations = COUNTRY_MAP[countryName] || [countryName]

        // Search for any of the country variations
        filters.$or = countryVariations.map(variation => ({
          location_text: { $containsi: variation }
        }))
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
        const sortField = args.sort === 'name' ? 'first_name:asc' : 'updatedAt:desc'
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

      // Build connection status map, plus a set of "previous hosts" - profiles I (as
      // guest) have a confirmed booking with. Used for the "Show only my previous hosts"
      // filter, which is deliberately one-directional: a past guest of mine showing up
      // as "connected" shouldn't count as a host I can filter by.
      let connectionMap = new Map<number, string>()
      const previousHostIds = new Set<number>()
      if (actorId) {
        const conns = await strapi.entityService.findMany('api::connection.connection', {
          filters: {
            $or: [{ actor_user: actorId }, { target_user: actorId }],
          },
          populate: { actor_user: { fields: ['id'] }, target_user: { fields: ['id'] } },
          page: 1,
          pageSize: 500,
        })
        // A pair can now have multiple connection rows over time (one per booking).
        // 'pending' always wins (it's the only status that should block a new request);
        // otherwise prefer 'connected' so a past stay is reflected, but neither status
        // permanently prevents booking the same host again for a new trip.
        for (const c of conns) {
          // Handle both populated (object) and unpopulated (number) cases
          const actorUserId = typeof c.actor_user === 'object' ? c.actor_user?.id : c.actor_user
          const targetUserId = typeof c.target_user === 'object' ? c.target_user?.id : c.target_user
          const otherId = actorUserId === actorId ? targetUserId : actorUserId
          if (!otherId) continue
          const prev = connectionMap.get(otherId)
          if (c.status === 'pending') connectionMap.set(otherId, 'pending')
          else if (c.status === 'connected' && prev !== 'pending') connectionMap.set(otherId, 'connected')
          else if (!prev) connectionMap.set(otherId, c.status)

          if (actorUserId === actorId && c.status === 'connected') {
            previousHostIds.add(otherId)
          }
        }
      }

      let results = records.map((p: any) => {
        const uid = p.user?.id
        const status = uid ? connectionMap.get(uid) || 'none' : 'none'
        const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.user?.username || 'Unknown'

        // Calculate proximity if coordinates are available
        let proximityMiles: number | null = null
        if (lat && lng && typeof p.location_lat === 'number' && typeof p.location_lng === 'number') {
          proximityMiles = p._dist !== undefined ? p._dist : haversine(lat, lng, p.location_lat, p.location_lng)
        }

        // Prepend backend URL to local image paths
        let profilePhotoUrl = p.profile_photo_url || null
        if (profilePhotoUrl && profilePhotoUrl.startsWith('/uploads/')) {
          const serverUrl = strapi.config.get('server.url', 'http://localhost:1337')
          profilePhotoUrl = `${serverUrl}${profilePhotoUrl}`
        }

        return {
          userId: String(uid || ''),
          name: fullName,
          university: p.university_name,
          location: p.location_text,
          connectionStatus: status,
          email: status === 'connected' ? p.user?.email || null : null,
          profilePhotoUrl,
          batchYear: p.batch_year || null,
          proximityMiles: proximityMiles,
          hostMode: p.host_mode || false,
          maxGuests: p.max_guests ?? null,
          // Store visibility and batch/university for post-filtering
          _profileVisibility: p.profile_visibility || 'everyone',
          _profileUniversity: p.university_name,
          _profileBatchYear: p.batch_year,
        }
      })

      // Filter to only previous hosts (bookings I made as the guest) if requested
      if (args.connected_only && actorId) {
        results = results.filter((r) => previousHostIds.has(Number(r.userId)))
      }

      // Filter by profile visibility
      // Get current user's profile for visibility matching
      if (actorId) {
        const actorProfiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: actorId },
          limit: 1,
        })
        const actorProfile = Array.isArray(actorProfiles) ? actorProfiles[0] : null
        const actorUniversity = actorProfile?.university_name
        const actorBatchYear = actorProfile?.batch_year

        results = results.filter((r: any) => {
          const visibility = r._profileVisibility
          if (visibility === 'everyone') return true
          if (visibility === 'same_university') {
            return actorUniversity && r._profileUniversity &&
              actorUniversity.toLowerCase() === r._profileUniversity.toLowerCase()
          }
          if (visibility === 'same_batch') {
            return actorBatchYear && r._profileBatchYear &&
              actorBatchYear === r._profileBatchYear
          }
          return true
        })
      }

      // Sort connected users first, but only in the default browsing order - an
      // explicit sort choice (proximity/name) must not be silently overridden by this,
      // or e.g. a far-away connected host would rank above a much closer new one.
      const isDefaultSort = !args.sort || args.sort === 'recent'
      if (!args.connected_only && actorId && isDefaultSort) {
        results.sort((a, b) => {
          // Connected users first
          if (a.connectionStatus === 'connected' && b.connectionStatus !== 'connected') return -1
          if (a.connectionStatus !== 'connected' && b.connectionStatus === 'connected') return 1
          return 0
        })
      }

      // Clean up internal fields before returning
      results = results.map((r: any) => {
        const { _profileVisibility, _profileUniversity, _profileBatchYear, ...clean } = r
        return clean
      })

      return results
    },
  },
}

export default searchResolvers
