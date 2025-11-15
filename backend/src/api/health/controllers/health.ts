export default {
  async healthz(ctx: any) {
    ctx.body = { status: 'ok' }
  },
  async readyz(ctx: any) {
    // In real app, check DB, plugins, etc.
    ctx.body = { status: 'ready' }
  },
}
