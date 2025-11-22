"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ env }) => ({
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
                // Optional: Enable TLS
                secure: false, // true for 465, false for other ports
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
