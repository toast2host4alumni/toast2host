import { createClient, cacheExchange, fetchExchange, dedupExchange } from 'urql'
import { getAuthToken } from '@/lib/auth'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'

export const graphqlClient = createClient({
  url: `${STRAPI_URL}/graphql`,
  exchanges: [dedupExchange, cacheExchange, fetchExchange],
  requestPolicy: 'cache-first',
  fetchOptions: () => {
    const token = getAuthToken()
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  },
})
