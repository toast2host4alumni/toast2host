export default ({ env }: any) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'dev-admin-jwt-secret'),
  },
  apiToken: {
    salt: env('ADMIN_API_TOKEN_SALT', 'dev-admin-api-salt'),
  },
});
