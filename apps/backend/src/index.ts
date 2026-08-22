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

    // Sync Google profile photo + name. Name fields are re-synced from
    // Google so the app's identity stays tied to the authenticated Google
    // account (supports LinkedIn-verification trust) rather than
    // free-typed profile text.
    //
    // This is a dedicated custom route the frontend calls right after it
    // gets the Strapi JWT, rather than an override of the built-in OAuth
    // controller. Two different standard override approaches (an
    // extensions/users-permissions/strapi-server.ts plugin override, and
    // directly patching strapi.plugin('users-permissions').controller('auth')
    // here in bootstrap) both loaded and ran at startup without error, but
    // neither one's override function ever actually executed at request
    // time across many real login attempts - strapi.plugin(...).controller(...)
    // appears not to return the same object instance that's actually wired
    // to route dispatch. A custom route sidesteps that entirely.
    strapi.server.routes([
      {
        method: 'POST',
        path: '/api/sync-google-profile',
        handler: async (ctx: any) => {
          try {
            const { access_token: accessToken, jwt } = ctx.request.body as {
              access_token?: string;
              jwt?: string;
            };

            if (!accessToken || !jwt) {
              ctx.status = 400;
              ctx.body = { error: 'access_token and jwt are required' };
              return;
            }

            const decoded = await strapi.plugin('users-permissions').service('jwt').verify(jwt);
            const userId = decoded?.id;

            if (!userId) {
              ctx.status = 401;
              ctx.body = { error: 'invalid jwt' };
              return;
            }

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

            ctx.status = 200;
            ctx.body = { synced: true };
          } catch (error) {
            console.error('Error syncing Google profile data:', error);
            ctx.status = 500;
            ctx.body = { error: 'sync failed' };
          }
        },
        config: { auth: false },
      },
    ]);
  },
};
