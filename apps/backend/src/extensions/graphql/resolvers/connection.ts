import { sendConnectionRequestEmail, sendConnectionApprovedEmail } from '../../../utils/email-service'

type GQLCtx = { state: { user?: { id: number } }; koaContext?: { request?: { header?: { origin?: string } } } }

// Same origins CORS already trusts (config/middlewares.ts) - reused here so the
// email link points at whichever frontend actually issued the request (dev vs prod)
// instead of a fixed FRONTEND_URL fallback, without letting a forged Origin header
// (this is just an HTTP header - a non-browser client can set it to anything) plant
// a phishing link in the email.
const ALLOWED_FRONTEND_ORIGINS = [
  'http://localhost:3000',
  'https://app.toast2host.net',
  'http://toast2host-frontend-730406059835.s3-website-us-east-1.amazonaws.com',
]

function resolveFrontendUrl(ctx: GQLCtx): string {
  const origin = ctx.koaContext?.request?.header?.origin
  if (origin && ALLOWED_FRONTEND_ORIGINS.includes(origin)) return origin
  return process.env.FRONTEND_URL || 'https://app.toast2host.net'
}

async function countConnectionsToday(actorId: number): Promise<number> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const items = await strapi.entityService.findMany('api::connection.connection', {
    filters: {
      actor_user: actorId,
      createdAt: { $gte: start.toISOString(), $lte: end.toISOString() },
    },
    page: 1,
    pageSize: 1000,
  })
  return Array.isArray(items) ? items.length : 0
}

// Shared shaping logic for myHostedBookings/myTrips - both are "connected" bookings,
// differing only in which side of the connection (actor vs target) is "the other user".
async function buildConfirmedBookings(
  conns: any[],
  getOtherId: (c: any) => number | undefined,
  getOtherUserData: (c: any) => any,
) {
  const otherIds = conns.map(getOtherId).filter(Boolean) as number[]

  const userMap = new Map<number, any>()
  for (const c of conns) {
    const otherUserData = getOtherUserData(c)
    if (otherUserData?.id) userMap.set(otherUserData.id, otherUserData)
  }

  let profileMap = new Map<number, any>()
  if (otherIds.length > 0) {
    const profiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { user: { id: { $in: otherIds } } },
      populate: { user: { fields: ['id'] } },
      page: 1,
      pageSize: 100,
    })
    for (const p of profiles) {
      const uid = p.user?.id
      if (uid) profileMap.set(uid, p)
    }
  }

  return conns.map((c: any) => {
    const otherId = getOtherId(c)
    const profile = otherId ? profileMap.get(otherId) : null
    const userData = otherId ? userMap.get(otherId) : null
    const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'Unknown'

    let profilePhotoUrl = profile?.profile_photo_url || null
    if (profilePhotoUrl && profilePhotoUrl.startsWith('/uploads/')) {
      const serverUrl = strapi.config.get('server.url', 'http://localhost:1337')
      profilePhotoUrl = `${serverUrl}${profilePhotoUrl}`
    }

    return {
      id: String(c.id),
      status: c.status,
      createdAt: c.createdAt,
      confirmedAt: c.updatedAt || c.createdAt || null,
      otherUser: {
        userId: String(otherId || ''),
        name: fullName || 'Unknown',
        university: profile?.university_name || null,
        location: profile?.location_text || null,
        profilePhotoUrl,
        batchYear: profile?.batch_year || null,
        linkedinUrl: profile?.linkedin_url || null,
        email: userData?.email || null,
      },
      travelDateFrom: c.travel_date_from || null,
      travelDateTo: c.travel_date_to || null,
      guestCount: c.guest_count || null,
    }
  })
}

const connectionResolvers = {
  Query: {
    myPendingConnections: async (_parent: unknown, _args: unknown, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const conns = await strapi.entityService.findMany('api::connection.connection', {
        filters: { target_user: user.id, status: 'pending' },
        populate: { actor_user: { fields: ['id', 'email'] } },
        page: 1,
        pageSize: 100,
      })

      // Fetch profiles for all actor users
      const actorIds = conns.map((c: any) => {
        const actorId = typeof c.actor_user === 'object' ? c.actor_user?.id : c.actor_user
        return actorId
      }).filter(Boolean)

      let profileMap = new Map<number, any>()
      let userMap = new Map<number, any>()

      // Store user emails
      for (const c of conns) {
        if (typeof c.actor_user === 'object' && c.actor_user?.id) {
          userMap.set(c.actor_user.id, c.actor_user)
        }
      }

      if (actorIds.length > 0) {
        const profiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: { id: { $in: actorIds } } },
          populate: { user: { fields: ['id'] } },
          page: 1,
          pageSize: 100,
        })
        for (const p of profiles) {
          const uid = p.user?.id
          if (uid) profileMap.set(uid, p)
        }
      }

      return conns.map((c: any) => {
        const actorId = typeof c.actor_user === 'object' ? c.actor_user?.id : c.actor_user
        const profile = actorId ? profileMap.get(actorId) : null
        const userData = actorId ? userMap.get(actorId) : null
        const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'Unknown'

        // Prepend backend URL to local image paths
        let profilePhotoUrl = profile?.profile_photo_url || null
        if (profilePhotoUrl && profilePhotoUrl.startsWith('/uploads/')) {
          const serverUrl = strapi.config.get('server.url', 'http://localhost:1337')
          profilePhotoUrl = `${serverUrl}${profilePhotoUrl}`
        }

        return {
          id: String(c.id),
          status: c.status,
          createdAt: c.createdAt,
          requester: {
            userId: String(actorId || ''),
            name: fullName || 'Unknown',
            university: profile?.university_name || null,
            location: profile?.location_text || null,
            profilePhotoUrl,
            batchYear: profile?.batch_year || null,
            linkedinUrl: profile?.linkedin_url || null,
            email: userData?.email || null,
          },
          travelDateFrom: c.travel_date_from || null,
          travelDateTo: c.travel_date_to || null,
          guestCount: c.guest_count || null,
        }
      })
    },
    myOutgoingPendingConnections: async (_parent: unknown, _args: unknown, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')

      // Get pending connections where I am the actor (I sent the request)
      const conns = await strapi.entityService.findMany('api::connection.connection', {
        filters: { actor_user: user.id, status: 'pending' },
        populate: { target_user: { fields: ['id', 'email'] } },
        page: 1,
        pageSize: 100,
      })

      // Fetch profiles for all target users
      const targetIds = conns.map((c: any) => {
        const targetId = typeof c.target_user === 'object' ? c.target_user?.id : c.target_user
        return targetId
      }).filter(Boolean)

      let profileMap = new Map<number, any>()
      let userMap = new Map<number, any>()

      // Store user emails
      for (const c of conns) {
        if (typeof c.target_user === 'object' && c.target_user?.id) {
          userMap.set(c.target_user.id, c.target_user)
        }
      }

      if (targetIds.length > 0) {
        const profiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: { id: { $in: targetIds } } },
          populate: { user: { fields: ['id'] } },
          page: 1,
          pageSize: 100,
        })
        for (const p of profiles) {
          const uid = p.user?.id
          if (uid) profileMap.set(uid, p)
        }
      }

      return conns.map((c: any) => {
        const targetId = typeof c.target_user === 'object' ? c.target_user?.id : c.target_user
        const profile = targetId ? profileMap.get(targetId) : null
        const userData = targetId ? userMap.get(targetId) : null
        const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'Unknown'

        // Prepend backend URL to local image paths
        let profilePhotoUrl = profile?.profile_photo_url || null
        if (profilePhotoUrl && profilePhotoUrl.startsWith('/uploads/')) {
          const serverUrl = strapi.config.get('server.url', 'http://localhost:1337')
          profilePhotoUrl = `${serverUrl}${profilePhotoUrl}`
        }

        return {
          id: String(c.id),
          status: c.status,
          createdAt: c.createdAt,
          targetUser: {
            userId: String(targetId || ''),
            name: fullName || 'Unknown',
            university: profile?.university_name || null,
            location: profile?.location_text || null,
            profilePhotoUrl,
            batchYear: profile?.batch_year || null,
            linkedinUrl: profile?.linkedin_url || null,
            email: null, // Don't show email until connected
          },
          travelDateFrom: c.travel_date_from || null,
          travelDateTo: c.travel_date_to || null,
          guestCount: c.guest_count || null,
        }
      })
    },
    // Confirmed bookings where I'm the HOST (target) - i.e. guests I've approved
    myHostedBookings: async (_parent: unknown, _args: unknown, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const conns = await strapi.entityService.findMany('api::connection.connection', {
        filters: { target_user: user.id, status: 'connected' },
        populate: { actor_user: { fields: ['id', 'email'] } },
        page: 1,
        pageSize: 100,
      })
      return buildConfirmedBookings(conns, (c: any) => (typeof c.actor_user === 'object' ? c.actor_user?.id : c.actor_user), (c: any) => (typeof c.actor_user === 'object' ? c.actor_user : null))
    },
    // Confirmed bookings where I'm the GUEST (actor) - i.e. trips I've booked
    myTrips: async (_parent: unknown, _args: unknown, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const conns = await strapi.entityService.findMany('api::connection.connection', {
        filters: { actor_user: user.id, status: 'connected' },
        populate: { target_user: { fields: ['id', 'email'] } },
        page: 1,
        pageSize: 100,
      })
      return buildConfirmedBookings(conns, (c: any) => (typeof c.target_user === 'object' ? c.target_user?.id : c.target_user), (c: any) => (typeof c.target_user === 'object' ? c.target_user : null))
    },
  },
  Mutation: {
    requestConnection: async (_parent: unknown, args: { targetUserId: string; travel_date_from?: string; travel_date_to?: string; guests?: number }, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const targetId = Number(args.targetUserId)
      if (!targetId || targetId === user.id) throw new Error('Invalid target')

      // Only block on an already-pending request for this pair (either direction) -
      // avoids spamming duplicate simultaneous requests. A prior connected or rejected
      // booking does NOT block a new one: each stay is booked and approved independently,
      // so the same host/guest pair can have multiple bookings across different trips.
      const existingPending = await strapi.entityService.findMany('api::connection.connection', {
        filters: {
          status: 'pending',
          $or: [
            { actor_user: user.id, target_user: targetId },
            { actor_user: targetId, target_user: user.id },
          ],
        },
        page: 1,
        pageSize: 1,
      })
      const existingPendingConn = Array.isArray(existingPending) ? existingPending[0] : null
      if (existingPendingConn) {
        return { id: String(existingPendingConn.id), status: existingPendingConn.status }
      }

      // A guest can only be in one place at a time - block a new request if they already
      // have a pending or confirmed booking (with this host or any other) whose dates overlap.
      // Rows with no dates set can't overlap anything and are naturally excluded by the
      // range comparison (comparing against null never matches).
      if (args.travel_date_from && args.travel_date_to) {
        const overlapping = await strapi.entityService.findMany('api::connection.connection', {
          filters: {
            actor_user: user.id,
            status: { $in: ['pending', 'connected'] },
            travel_date_from: { $lte: args.travel_date_to },
            travel_date_to: { $gte: args.travel_date_from },
          },
          page: 1,
          pageSize: 1,
        })
        if (Array.isArray(overlapping) && overlapping[0]) {
          throw new Error('OVERLAPPING_DATES')
        }

        // A host can't be double-booked either. Only checked against CONFIRMED bookings -
        // multiple guests are still free to submit competing pending requests for the same
        // window (the host picks one); it's only blocked once one is actually confirmed.
        const hostOverlap = await strapi.entityService.findMany('api::connection.connection', {
          filters: {
            target_user: targetId,
            status: 'connected',
            travel_date_from: { $lte: args.travel_date_to },
            travel_date_to: { $gte: args.travel_date_from },
          },
          page: 1,
          pageSize: 1,
        })
        if (Array.isArray(hostOverlap) && hostOverlap[0]) {
          throw new Error('HOST_UNAVAILABLE')
        }
      }

      // Enforce the host's stated guest capacity, if they've set one
      if (args.guests) {
        const hostProfiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: targetId },
          limit: 1,
        })
        const hostProfile = Array.isArray(hostProfiles) ? hostProfiles[0] : null
        if (hostProfile?.max_guests && args.guests > hostProfile.max_guests) {
          throw new Error('EXCEEDS_HOST_CAPACITY')
        }
      }

      // Daily cap enforcement
      const custom = strapi.config.get('custom') as any
      const cap = Number(custom?.dailyConnectCap ?? 10)
      const count = await countConnectionsToday(user.id)
      if (count >= cap) throw new Error('DAILY_CAP_REACHED')

      const consentRequired = Boolean(custom?.consentRequired ?? true)
      const status = consentRequired ? 'pending' : 'connected'
      const connection = await strapi.entityService.create('api::connection.connection', {
        data: {
          actor_user: user.id,
          target_user: targetId,
          status,
          travel_date_from: args.travel_date_from || null,
          travel_date_to: args.travel_date_to || null,
          guest_count: args.guests || null,
        },
      })
      await strapi.entityService.create('api::connection-event.connection-event', {
        data: { connection: connection.id, actor_user: user.id, target_user: targetId, type: 'requested' },
      })
      if (!consentRequired) {
        await strapi.entityService.create('api::connection-event.connection-event', {
          data: { connection: connection.id, actor_user: user.id, target_user: targetId, type: 'revealed' },
        })
      }

      // Send email notification to target user
      try {
        // Fetch guest (actor) profile
        const guestProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: user.id },
          populate: { user: { fields: ['id', 'email'] } },
          limit: 1,
        })

        // Fetch host (target) profile
        const hostProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: targetId },
          populate: { user: { fields: ['id', 'email'] } },
          limit: 1,
        })

        if (guestProfile[0] && hostProfile[0] && hostProfile[0].user?.email) {
          const serverUrl = strapi.config.get('server.url', 'http://localhost:1337')
          const frontendUrl = resolveFrontendUrl(ctx)
          const logoUrl = `${serverUrl}/t2h_logo.png`

          await sendConnectionRequestEmail({
            hostEmail: hostProfile[0].user.email,
            hostFirstName: hostProfile[0].first_name || 'there',
            guestFullName: [guestProfile[0].first_name, guestProfile[0].last_name].filter(Boolean).join(' ') || 'Alumni',
            guestFirstName: guestProfile[0].first_name || 'Alumni',
            guestUniversity: guestProfile[0].university_name || 'Unknown University',
            guestBatch: guestProfile[0].batch_year ? String(guestProfile[0].batch_year) : 'Unknown',
            guestLinkedIn: guestProfile[0].linkedin_url || undefined,
            travelDateFrom: args.travel_date_from || undefined,
            travelDateTo: args.travel_date_to || undefined,
            guestCount: args.guests || undefined,
            connectionsUrl: `${frontendUrl}/connections`,
            logoUrl,
          })
        }
      } catch (emailError) {
        console.error('Failed to send connection request email:', emailError)
        // Don't fail the connection request if email fails
      }

      return { id: String(connection.id), status }
    },
    acceptConnection: async (_parent: unknown, args: { id: string }, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const connId = Number(args.id)
      const conn = await strapi.entityService.findOne('api::connection.connection', connId, { populate: { actor_user: true, target_user: true } })
      if (!conn || conn.status !== 'pending' || conn.target_user?.id !== user.id) throw new Error('Invalid connection')

      // Multiple pending requests can compete for the same window, but approving this one
      // must not double-book the host against an already-confirmed booking.
      if (conn.travel_date_from && conn.travel_date_to) {
        const hostOverlap = await strapi.entityService.findMany('api::connection.connection', {
          filters: {
            target_user: user.id,
            status: 'connected',
            id: { $ne: connId },
            travel_date_from: { $lte: conn.travel_date_to },
            travel_date_to: { $gte: conn.travel_date_from },
          },
          page: 1,
          pageSize: 1,
        })
        if (Array.isArray(hostOverlap) && hostOverlap[0]) {
          throw new Error('HOST_DOUBLE_BOOKED')
        }
      }

      const updated = await strapi.entityService.update('api::connection.connection', connId, { data: { status: 'connected' } })
      await strapi.entityService.create('api::connection-event.connection-event', {
        data: { connection: connId, actor_user: conn.actor_user?.id, target_user: user.id, type: 'approved' },
      })
      await strapi.entityService.create('api::connection-event.connection-event', {
        data: { connection: connId, actor_user: conn.actor_user?.id, target_user: user.id, type: 'revealed' },
      })

      // Send email notification to the requester (actor)
      try {
        const actorId = conn.actor_user?.id
        const hostId = user.id

        // Fetch guest (actor) profile
        const guestProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: actorId },
          populate: { user: { fields: ['id', 'email'] } },
          limit: 1,
        })

        // Fetch host (target) profile
        const hostProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: hostId },
          populate: { user: { fields: ['id', 'email'] } },
          limit: 1,
        })

        if (guestProfile[0] && hostProfile[0] && guestProfile[0].user?.email) {
          const serverUrl = strapi.config.get('server.url', 'http://localhost:1337')
          const frontendUrl = resolveFrontendUrl(ctx)
          const logoUrl = `${serverUrl}/t2h_logo.png`

          await sendConnectionApprovedEmail({
            guestEmail: guestProfile[0].user.email,
            guestFirstName: guestProfile[0].first_name || 'there',
            hostFullName: [hostProfile[0].first_name, hostProfile[0].last_name].filter(Boolean).join(' ') || 'Alumni',
            hostEmail: hostProfile[0].user?.email || '',
            hostUniversity: hostProfile[0].university_name || 'Unknown University',
            hostBatch: hostProfile[0].batch_year ? String(hostProfile[0].batch_year) : 'Unknown',
            hostLocation: hostProfile[0].location_text || undefined,
            travelDateFrom: conn.travel_date_from || undefined,
            travelDateTo: conn.travel_date_to || undefined,
            guestCount: conn.guest_count || undefined,
            connectionsUrl: `${frontendUrl}/connections`,
            logoUrl,
          })
        }
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError)
        // Don't fail the connection approval if email fails
      }

      return { id: String(updated.id), status: updated.status }
    },
    denyConnection: async (_parent: unknown, args: { id: string }, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const connId = Number(args.id)
      const conn = await strapi.entityService.findOne('api::connection.connection', connId, { populate: { target_user: true } })
      if (!conn || conn.status !== 'pending' || conn.target_user?.id !== user.id) throw new Error('Invalid connection')
      const updated = await strapi.entityService.update('api::connection.connection', connId, { data: { status: 'rejected' } })
      await strapi.entityService.create('api::connection-event.connection-event', {
        data: { connection: connId, actor_user: conn.actor_user?.id, target_user: user.id, type: 'rejected' },
      })
      return { id: String(updated.id), status: updated.status }
    },
  },
}

export default connectionResolvers
