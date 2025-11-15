import { randomUUID } from 'crypto';

export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Generate or extract request ID
    const requestId = ctx.request.headers['x-request-id'] || randomUUID();

    // Attach to context for access in controllers
    ctx.state.requestId = requestId;

    // Add to response headers
    ctx.set('X-Request-ID', requestId);

    // Enhance logger with request ID
    const originalLogger = strapi.log;
    ctx.log = {
      info: (message: string, meta?: any) => originalLogger.info(message, { requestId, ...meta }),
      warn: (message: string, meta?: any) => originalLogger.warn(message, { requestId, ...meta }),
      error: (message: string, meta?: any) => originalLogger.error(message, { requestId, ...meta }),
      debug: (message: string, meta?: any) => originalLogger.debug(message, { requestId, ...meta }),
    };

    // Log incoming request
    strapi.log.info('Incoming request', {
      requestId,
      method: ctx.method,
      url: ctx.url,
      userAgent: ctx.request.headers['user-agent'],
    });

    const startTime = Date.now();

    try {
      await next();

      // Log response
      const duration = Date.now() - startTime;
      strapi.log.info('Request completed', {
        requestId,
        method: ctx.method,
        url: ctx.url,
        status: ctx.status,
        duration,
      });
    } catch (error) {
      // Log error with request ID
      const duration = Date.now() - startTime;
      strapi.log.error('Request failed', {
        requestId,
        method: ctx.method,
        url: ctx.url,
        error: error.message,
        duration,
      });
      throw error;
    }
  };
};
