import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe } from '@/lib/graphql/operations'

export const CURRENT_USER_QUERY_KEY = ['currentUser'] as const

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getMe({ skipCache: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

export function useInvalidateCurrentUser() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
}

export function useIsOnboarded() {
  const { data: user, isLoading } = useCurrentUser()
  return {
    isOnboarded: !!user?.profile?.onboarding_completed,
    isLoading,
    user,
  }
}
