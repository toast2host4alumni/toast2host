export default ({ env }: any) => [
  'global::request-id',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:3000',
        'http://localhost:1337',
        'https://app.toast2host.net',
        'http://toast2host-frontend-730406059835.s3-website-us-east-1.amazonaws.com',
      ],
      credentials: true,
      headers: '*',
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  {
    name: 'strapi::session',
    config: {
      secure: env.bool('COOKIE_SECURE', process.env.NODE_ENV === 'production'),
      sameSite: 'lax',
      httpOnly: true,
    },
  },
  'strapi::favicon',
  'strapi::public',
];

