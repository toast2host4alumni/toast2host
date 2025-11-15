export default {
  async index(ctx: any) {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    const onboarded = await strapi.entityService.findMany('api::user-profile.user-profile', { page: 1, pageSize: 1 })
    const onboardedCount = Array.isArray(onboarded) ? (onboarded as any).pagination?.total ?? onboarded.length : 0
    const connectionsToday = await strapi.entityService.findMany('api::connection.connection', {
      filters: { createdAt: { $gte: start.toISOString(), $lte: end.toISOString() } },
      page: 1,
      pageSize: 1,
    })
    const connectionsCount = Array.isArray(connectionsToday) ? (connectionsToday as any).pagination?.total ?? connectionsToday.length : 0

    ctx.body = {
      request_count: null,
      latency_p50_ms: null,
      latency_p95_ms: null,
      error_rate: null,
      onboarded_users: onboardedCount,
      connections_today: connectionsCount,
    }
  },
}
