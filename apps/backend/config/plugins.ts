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
  // Email configuration - Brevo via Nodemailer
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp-relay.brevo.com'),
        port: env('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
        secure: false,
        tls: {
          rejectUnauthorized: true,
        },
      },
      settings: {
        defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
      },
    },
  },
});
