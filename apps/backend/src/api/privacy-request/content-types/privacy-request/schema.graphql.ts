export default {
  // Disable automatic GraphQL schema generation for privacy-request
  // We have custom resolvers that handle this content-type
  config: {
    mutation: false,
    query: false,
  },
}
