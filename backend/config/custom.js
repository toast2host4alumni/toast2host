"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ env }) => ({
    consentRequired: env.bool('CONSENT_REQUIRED', true),
    dailyConnectCap: env.int('DAILY_CONNECT_CAP', 10),
    notificationsEmailEnabled: env.bool('NOTIFICATIONS_EMAIL_ENABLED', false),
});
