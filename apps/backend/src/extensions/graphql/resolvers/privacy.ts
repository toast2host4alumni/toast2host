type GQLCtx = { state: { user?: { id: number } } }

const privacyResolvers = {
  Query: {
    myPrivacyRequests: async (_p: unknown, _a: unknown, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const items = await strapi.entityService.findMany('api::privacy-request.privacy-request', {
        filters: { user: user.id },
        sort: 'createdAt:desc',
        page: 1,
        pageSize: 100,
      })
      return items.map((x: any) => ({
        id: String(x.id),
        type: x.type,
        status: x.status,
        created_at: x.createdAt,
        completed_at: x.completed_at || null,
      }))
    },
  },
  Mutation: {
    submitPrivacyRequest: async (_parent: unknown, args: { type: 'deletion' | 'export' }, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const rec = await strapi.entityService.create('api::privacy-request.privacy-request', {
        data: { user: user.id, type: args.type, status: 'open' },
      })
      return {
        id: String(rec.id),
        type: rec.type,
        status: rec.status,
        created_at: rec.createdAt,
        completed_at: rec.completed_at || null,
      }
    },
  },
}

export default privacyResolvers
