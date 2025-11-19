const TOKEN_KEY = 't2h_token'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function removeAuthToken() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

