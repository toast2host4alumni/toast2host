export default {
  routes: [
    {
      method: 'GET',
      path: '/metrics',
      handler: 'metrics.index',
      config: { auth: false },
    },
  ],
}

