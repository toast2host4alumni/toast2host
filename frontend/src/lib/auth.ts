export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('t2h_token')
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('t2h_token', token)
}

