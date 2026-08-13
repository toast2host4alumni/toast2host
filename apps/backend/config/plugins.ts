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
  // Disable GraphQL shadow CRUD for content-types with custom resolvers
  // This is handled via content-type schema extensions
  //
  'users-permissions': {
    enabled: true,
    config: {
      providers: {
        google: {
          enabled: true,
          clientId: env('PROVIDER_GOOGLE_CLIENT_ID'),
          clientSecret: env('PROVIDER_GOOGLE_CLIENT_SECRET'),
          redirectUri: env('PROVIDER_GOOGLE_CALLBACK', 'http://localhost:1337/api/connect/google/callback'),
          scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
          prompt: 'consent',
        },
      },
    },
  },
  // Email configuration - AWS SES
  email: {
    config: {
      provider: 'amazon-ses',
      providerOptions: {
        key: env('AWS_SES_KEY'),
        secret: env('AWS_SES_SECRET'),
        // Must be a full endpoint URL, not a bare region string - the provider
        // parses the region back out of this via a `email.<region>.amazonaws.com`
        // regex match. Passing just "us-east-1" here silently sets an invalid
        // SESClient `endpoint` instead of the intended region.
        amazon: `https://email.${env('AWS_SES_REGION', 'us-east-1')}.amazonaws.com`,
      },
      settings: {
        defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
      },
    },
  },
});
