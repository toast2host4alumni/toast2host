'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { graphqlClient } from '@/lib/graphql/client'
import type { SearchParams } from '@/lib/validation/search'

const SEARCH_USERS = `
  query SearchUsers($location: String, $lat: Float, $lng: Float, $scope: LocationScope, $university: String, $batch_year: Int, $sort: SearchSort, $not_connected_only: Boolean, $name: String, $page: Int, $pageSize: Int) {
    searchUsers(location: $location, lat: $lat, lng: $lng, scope: $scope, university: $university, batch_year: $batch_year, sort: $sort, not_connected_only: $not_connected_only, name: $name, page: $page, pageSize: $pageSize) {
      userId
      name
      university
      location
      connectionStatus
    }
  }
` as const

export function useSearch(params: Omit<SearchParams, 'page' | 'pageSize'>, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['search', params, pageSize],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await graphqlClient
        .query<{ searchUsers: any[] }>(SEARCH_USERS, { ...params, page: pageParam, pageSize })
        .toPromise()
      if (res.error) throw res.error
      return { page: pageParam as number, items: res.data?.searchUsers ?? [] }
    },
    getNextPageParam: (last) => (last.items.length < pageSize ? undefined : last.page + 1),
  })
}

