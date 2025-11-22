export default (plugin: any) => {
  // Override the OAuth callback to save Google profile photo
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
          // Get access token from the response or session
          const accessToken = ctx.session?.grant?.response?.access_token

          if (accessToken) {
            // Fetch Google user info
            const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            })

            const googleUser = await googleResponse.json() as { picture?: string }
            const pictureUrl = googleUser.picture

            if (pictureUrl) {
              // Check if user already has a profile
              const existingProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
                filters: { user: userId },
                limit: 1,
              })

              if (existingProfile && existingProfile.length > 0) {
                // Update existing profile with photo URL
                await strapi.entityService.update('api::user-profile.user-profile', existingProfile[0].id, {
                  data: {
                    profile_photo_url: pictureUrl,
                  },
                })
              } else {
                // Create new profile with photo URL
                await strapi.entityService.create('api::user-profile.user-profile', {
                  data: {
                    user: userId,
                    profile_photo_url: pictureUrl,
                  },
                })
              }

              console.log(`Google profile photo saved for user ${userId}`)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error saving Google profile photo:', error)
      // Don't fail the OAuth flow if photo download fails
    }

    return response
  }

  return plugin
}
