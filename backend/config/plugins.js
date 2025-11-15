"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ env }) => ({
    graphql: {
        enabled: true,
        config: {},
    },
    'users-permissions': {
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
