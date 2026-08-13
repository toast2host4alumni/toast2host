
type UpdateProfileInput = {
  first_name?: string
  last_name?: string
  profile_photo_url?: string
  university_name?: string
  linkedin_url?: string
  location_text?: string
  location_lat?: number
  location_lng?: number
  location_scope?: 'city' | 'state' | 'country'
  batch_year?: number
  onboarding_completed?: boolean
  host_mode?: boolean
  max_guests?: number
  available_from?: string | null
  available_to?: string | null
  always_available?: boolean
  phone_number?: string
  profile_visibility?: 'everyone' | 'same_university' | 'same_batch'
}

type GQLCtx = { state: { user?: { id: number } } }

const profileResolvers = {
  Mutation: {
    updateMyProfile: async (
      _parent: unknown,
      args: { input: UpdateProfileInput },
      ctx: GQLCtx
    ) => {
      const user = ctx.state.user
      if (!user) throw new Error('Unauthorized')
      const existing = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: { user: user.id },
        limit: 1,
      })
      const data = { ...args.input, user: user.id }
      let profile
      if (Array.isArray(existing) && existing[0]) {
        profile = await strapi.entityService.update('api::user-profile.user-profile', existing[0].id, { data })
      } else {
        profile = await strapi.entityService.create('api::user-profile.user-profile', { data })
      }
      return { profile }
    },
  },
}

export default profileResolvers
