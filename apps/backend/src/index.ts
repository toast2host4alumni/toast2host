import graphqlSchema from './extensions/graphql/config/schema';

export default {
  register({ strapi }: any) {
    // Register custom GraphQL schema and resolvers
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use({
      typeDefs: graphqlSchema.typeDefs,
      resolvers: graphqlSchema.resolvers,
    });
  },

  async bootstrap({ strapi }: any) {
    // Update Google OAuth provider scopes
    const grantStore = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'grant' });
    const grantConfig = await grantStore.get();

    if (grantConfig && grantConfig.google) {
      grantConfig.google.scope = ['email', 'profile'];
      grantConfig.google.prompt = 'consent';
      await grantStore.set({ value: grantConfig });
      console.log('Updated Google OAuth scopes to include profile');
    }

    // Sync Google profile photo + name on every login. Name fields are
    // re-synced from Google so the app's identity stays tied to the
    // authenticated Google account (supports LinkedIn-verification trust)
    // rather than free-typed profile text.
    //
    // This must be patched here in bootstrap(), not via
    // extensions/users-permissions/strapi-server.ts - that file's plugin
    // override is applied during plugin loading, but something later in
    // Strapi's route/controller resolution doesn't pick up the mutation
    // (confirmed: the override function itself never runs at request time,
    // even though the extension file loads and its export runs at boot).
    // Patching the live controller object here, after all plugins are
    // fully registered, is the pattern Strapi actually honors.
    const authController = strapi.plugin('users-permissions').controller('auth');
    const originalCallback = authController.callback;

    authController.callback = async (ctx: any) => {
      // originalCallback responds via ctx.send(data), which sets
      // ctx.body directly and returns nothing - read the response back
      // off ctx.body rather than this call's return value.
      await originalCallback(ctx);
      const response = ctx.body;

      try {
        const userId = response?.user?.id;

        if (userId) {
          const { provider } = ctx.params;

          if (provider === 'google') {
            // Access token comes from the query string, not ctx.session:
            // the frontend and backend run on separate origins and this
            // request is a fetch(), not a top-level navigation, so
            // SameSite=Lax session cookies from the earlier
            // /api/connect/google/callback leg never arrive here.
            const accessToken = ctx.query?.access_token;

            if (accessToken) {
              const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              const googleUser = (await googleResponse.json()) as {
                picture?: string;
                given_name?: string;
                family_name?: string;
              };
              const pictureUrl = googleUser.picture;
              const firstName = googleUser.given_name;
              const lastName = googleUser.family_name;

              if (pictureUrl || firstName || lastName) {
                const data: Record<string, string> = {};
                if (pictureUrl) data.profile_photo_url = pictureUrl;
                if (firstName) data.first_name = firstName;
                if (lastName) data.last_name = lastName;

                const existingProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
                  filters: { user: userId },
                  limit: 1,
                });

                if (existingProfile && existingProfile.length > 0) {
                  await strapi.entityService.update('api::user-profile.user-profile', existingProfile[0].id, {
                    data,
                  });
                } else {
                  await strapi.entityService.create('api::user-profile.user-profile', {
                    data: { user: userId, ...data },
                  });
                }

                console.log(`Google profile data synced for user ${userId}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error syncing Google profile data:', error);
        // Don't fail the OAuth flow if the sync fails
      }

      return response;
    };
  },
};
