export default (plugin: any) => {
  // Override the OAuth callback to save Google profile photo + name.
  // Name fields are re-synced from Google on every login so the app's
  // identity stays tied to the authenticated Google account (supports
  // LinkedIn-verification trust) rather than free-typed profile text.
  const originalCallback = plugin.controllers.auth.callback

  plugin.controllers.auth.callback = async (ctx: any) => {
    // Call original callback first
    const response = await originalCallback(ctx)

    try {
      // Get the user from the response
      const userId = response?.user?.id

      if (userId) {
        // Get Google user data from the provider
        const { provider } = ctx.params

        if (provider === 'google') {
          // Get access token from the query string. Note: ctx.session is
          // unreliable here since the frontend and backend run on separate
          // origins and this request is a fetch(), not a top-level
          // navigation — SameSite=Lax session cookies from the earlier
          // /api/connect/google/callback leg never arrive on this request.
          const accessToken = ctx.query?.access_token || ctx.session?.grant?.response?.access_token

          if (accessToken) {
            // Fetch Google user info
            const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            })

            const googleUser = await googleResponse.json() as {
              picture?: string
              given_name?: string
              family_name?: string
            }
            // TEMP DEBUG - remove once we've diagnosed the missing-name issue
            console.log(`Google userinfo status=${googleResponse.status} body=${JSON.stringify(googleUser)}`)
            const pictureUrl = googleUser.picture
            const firstName = googleUser.given_name
            const lastName = googleUser.family_name

            if (pictureUrl || firstName || lastName) {
              const data: Record<string, string> = {}
              if (pictureUrl) data.profile_photo_url = pictureUrl
              if (firstName) data.first_name = firstName
              if (lastName) data.last_name = lastName

              // Check if user already has a profile
              const existingProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
                filters: { user: userId },
                limit: 1,
              })

              if (existingProfile && existingProfile.length > 0) {
                await strapi.entityService.update('api::user-profile.user-profile', existingProfile[0].id, {
                  data,
                })
              } else {
                await strapi.entityService.create('api::user-profile.user-profile', {
                  data: {
                    user: userId,
                    ...data,
                  },
                })
              }

              console.log(`Google profile data synced for user ${userId}`)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing Google profile data:', error)
      // Don't fail the OAuth flow if the sync fails
    }

    return response
  }

  return plugin
}
