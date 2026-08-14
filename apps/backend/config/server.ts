import stayReminderTasks from '../src/cron/stay-reminders'

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
  cron: {
    enabled: true,
    // Strapi only reads cron tasks from server.cron.tasks in the merged
    // config - a standalone config/cron-tasks.ts file is NOT auto-loaded
    // into the cron subsystem (only config/server.ts, config/database.ts
    // etc. are recognized top-level config domains), so the task has to be
    // imported and nested here explicitly.
    tasks: stayReminderTasks,
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
