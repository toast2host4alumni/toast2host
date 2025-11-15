export default ({ env }: any) => ({
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: true,
      depthLimit: 10,
      apolloServer: {
        introspection: true,
      },
    },
  },
  'users-permissions': {
    enabled: true,
    config: {
      providers: {
        google: {
          enabled: true,
          clientId: env('PROVIDER_GOOGLE_CLIENT_ID'),
          clientSecret: env('PROVIDER_GOOGLE_CLIENT_SECRET'),
          redirectUri: env('PROVIDER_GOOGLE_CALLBACK', 'http://localhost:1337/api/connect/google/callback'),
        },
      },
    },
  },
});
