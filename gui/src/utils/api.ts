/**
 * Fetch utility that automatically includes auth token from localStorage
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem('access_token')

  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  return fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  })
}
