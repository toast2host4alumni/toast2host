export default {
  routes: [
    {
      method: 'GET',
      path: '/healthz',
      handler: 'health.healthz',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/readyz',
      handler: 'health.readyz',
      config: { auth: false },
    },
  ],
}

