import { createClient, cacheExchange, fetchExchange } from 'urql'
import { getAuthToken } from '@/lib/auth'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'

export const graphqlClient = createClient({
  url: `${STRAPI_URL}/graphql`,
  exchanges: [cacheExchange, fetchExchange],
  requestPolicy: 'cache-first',
  fetchOptions: () => {
    const token = getAuthToken()
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  },
})
