import { createClient, cacheExchange, fetchExchange } from 'urql'
import { getAuthToken } from '@/lib/auth'

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL

if (!STRAPI_URL) {
  throw new Error('VITE_STRAPI_URL is not defined')
}

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
