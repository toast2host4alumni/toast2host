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
        page: 1,
        pageSize: 100,
      })
      return conns.map((c: any) => ({ id: String(c.id), status: c.status }))
    },
  },
  Mutation: {
    createConnection: async (_parent: unknown, args: { targetUserId: string }, ctx: GQLCtx) => {
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
      return { id: String(connection.id), status }
    },
    approveConnection: async (_parent: unknown, args: { id: string }, ctx: GQLCtx) => {
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
    rejectConnection: async (_parent: unknown, args: { id: string }, ctx: GQLCtx) => {
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
