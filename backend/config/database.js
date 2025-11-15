"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ env }) => ({
    connection: {
        client: env('DATABASE_CLIENT', 'sqlite'),
        connection: env('DATABASE_CLIENT', 'sqlite') === 'postgres' ? {
            connectionString: env('DATABASE_URL', ''),
            ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
        } : {
            filename: env('SQLITE_FILENAME', '.tmp/data.db'),
        },
        pool: { min: 0, max: 10 },
    },
});
