type GQLCtx = { state: { user?: { id: number; email: string } } }

const meResolvers = {
  Query: {
    currentUser: async (_parent: unknown, _args: unknown, ctx: GQLCtx) => {
      const user = ctx.state.user
      if (!user) return null
      const profiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: { user: user.id },
        limit: 1,
      })
      const profile = Array.isArray(profiles) ? profiles[0] : null
      return { id: String(user.id), email: user.email, profile }
    },
  },
}

export default meResolvers
