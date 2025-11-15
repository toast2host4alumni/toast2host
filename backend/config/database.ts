export default ({ env }: any) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'sqlite'),
    connection: env('DATABASE_CLIENT', 'sqlite') === 'postgres' ? {
      connectionString: env('DATABASE_URL', ''),
      ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
    } : {
      filename: env('SQLITE_FILENAME', '.tmp/data.db'),
    },
    pool: { min: 0, max: 1 },
    useNullAsDefault: env('DATABASE_CLIENT', 'sqlite') === 'sqlite',
    acquireConnectionTimeout: 60000,
  },
});
