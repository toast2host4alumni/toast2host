export default ({ env }: any) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  proxy: {
    koa: true,
  },
  app: {
    keys: env.array('APP_KEYS', ['change-me-1', 'change-me-2']),
  },
  logger: {
    level: env('LOG_LEVEL', 'info'),
    // Structured JSON logging for production observability
    transports: {
      console: {
        format: 'json',
        options: {
          colors: false,
          timestamp: true,
        },
      },
    },
  },
});
