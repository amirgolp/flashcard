/**
 * Fetch utility that automatically includes auth token from localStorage
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(`http://localhost:8000${url}`, {
        ...options,
        headers,
    });
}
