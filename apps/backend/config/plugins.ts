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
  // Email configuration - Brevo, via SMTP relay (switched from AWS SES after
  // its production-access request was denied - see AWS's response for
  // context). Brevo restricts SMTP relay to IPs explicitly authorized in
  // their dashboard (Security -> Authorized IPs), so this will only work
  // from the EC2 backend's static IP and whichever dev machine's current
  // public IP has been added there.
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp-relay.brevo.com'),
        port: env.int('SMTP_PORT', 587),
        secure: false, // port 587 uses STARTTLS, not implicit TLS
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
      },
    },
  },
});
