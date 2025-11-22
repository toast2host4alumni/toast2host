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
  },
};
