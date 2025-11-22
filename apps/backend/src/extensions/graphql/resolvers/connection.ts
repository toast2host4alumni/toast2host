import { sendConnectionRequestEmail } from '../../../utils/email-service'

type GQLCtx = { state: { user?: { id: number } } }

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
        }
      })
    },
    myConnections: async (_parent: unknown, _args: unknown, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')

      // Get all connections where I am actor or target
      const conns = await strapi.entityService.findMany('api::connection.connection', {
        filters: {
          status: 'connected',
          $or: [
            { actor_user: user.id },
            { target_user: user.id },
          ],
        },
        populate: {
          actor_user: { fields: ['id', 'email'] },
          target_user: { fields: ['id', 'email'] },
        },
        page: 1,
        pageSize: 200,
      })

      // Get the other user's ID for each connection
      const otherUserIds: number[] = []
      const connMap = new Map<number, any>()

      for (const c of conns) {
        const actorId = typeof c.actor_user === 'object' ? c.actor_user?.id : c.actor_user
        const targetId = typeof c.target_user === 'object' ? c.target_user?.id : c.target_user
        const otherId = actorId === user.id ? targetId : actorId
        if (otherId && !otherUserIds.includes(otherId)) {
          otherUserIds.push(otherId)
          connMap.set(otherId, c)
        }
      }

      // Fetch profiles
      let profileMap = new Map<number, any>()
      let userMap = new Map<number, any>()

      for (const c of conns) {
        if (typeof c.actor_user === 'object' && c.actor_user?.id) {
          userMap.set(c.actor_user.id, c.actor_user)
        }
        if (typeof c.target_user === 'object' && c.target_user?.id) {
          userMap.set(c.target_user.id, c.target_user)
        }
      }

      if (otherUserIds.length > 0) {
        const profiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
          filters: { user: { id: { $in: otherUserIds } } },
          populate: { user: { fields: ['id'] } },
          page: 1,
          pageSize: 200,
        })
        for (const p of profiles) {
          const uid = p.user?.id
          if (uid) profileMap.set(uid, p)
        }
      }

      return otherUserIds.map((otherId) => {
        const profile = profileMap.get(otherId)
        const userData = userMap.get(otherId)
        const conn = connMap.get(otherId)
        const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'Unknown'
        return {
          userId: String(otherId),
          name: fullName || 'Unknown',
          university: profile?.university_name || null,
          location: profile?.location_text || null,
          profilePhotoUrl: profile?.profile_photo_url || null,
          batchYear: profile?.batch_year || null,
          linkedinUrl: profile?.linkedin_url || null,
          email: userData?.email || '',
          connectedAt: conn?.updatedAt || conn?.createdAt || '',
        }
      })
    },
  },
  Mutation: {
    requestConnection: async (_parent: unknown, args: { targetUserId: string }, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const targetId = Number(args.targetUserId)
      if (!targetId || targetId === user.id) throw new Error('Invalid target')

      // Prevent duplicate connections for same pair (check both directions)
      const existing = await strapi.entityService.findMany('api::connection.connection', {
        filters: {
          $or: [
            { actor_user: user.id, target_user: targetId },
            { actor_user: targetId, target_user: user.id },
          ],
        },
        page: 1,
        pageSize: 1,
      })
      if (Array.isArray(existing) && existing[0]) {
        // Return existing connection regardless of direction
        return { id: String(existing[0].id), status: existing[0].status }
      }

      // Daily cap enforcement
      const custom = strapi.config.get('custom') as any
      const cap = Number(custom?.dailyConnectCap ?? 10)
      const count = await countConnectionsToday(user.id)
      if (count >= cap) throw new Error('DAILY_CAP_REACHED')

      const consentRequired = Boolean(custom?.consentRequired ?? true)
      const status = consentRequired ? 'pending' : 'connected'
      const connection = await strapi.entityService.create('api::connection.connection', {
        data: { actor_user: user.id, target_user: targetId, status },
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
          const frontendUrl = process.env.FRONTEND_URL || 'https://app.toast2host.net'
          const logoUrl = `${serverUrl}/t2h_logo.png`

          await sendConnectionRequestEmail({
            hostEmail: hostProfile[0].user.email,
            hostFirstName: hostProfile[0].first_name || 'there',
            guestFullName: [guestProfile[0].first_name, guestProfile[0].last_name].filter(Boolean).join(' ') || 'Alumni',
            guestFirstName: guestProfile[0].first_name || 'Alumni',
            guestUniversity: guestProfile[0].university_name || 'Unknown University',
            guestBatch: guestProfile[0].batch_year ? String(guestProfile[0].batch_year) : 'Unknown',
            guestLinkedIn: guestProfile[0].linkedin_url || undefined,
            connectionsUrl: `${frontendUrl}/requests`,
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
      const updated = await strapi.entityService.update('api::connection.connection', connId, { data: { status: 'connected' } })
      await strapi.entityService.create('api::connection-event.connection-event', {
        data: { connection: connId, actor_user: conn.actor_user?.id, target_user: user.id, type: 'approved' },
      })
      await strapi.entityService.create('api::connection-event.connection-event', {
        data: { connection: connId, actor_user: conn.actor_user?.id, target_user: user.id, type: 'revealed' },
      })
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
