"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ env }) => ({
    app: {
        keys: env.array('APP_KEYS', ['change-me-1', 'change-me-2']),
    },
    logger: {
        level: env('LOG_LEVEL', 'info'),
    },
});
