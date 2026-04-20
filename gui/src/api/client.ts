import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }

    // Extract backend error message if available
    const detail = error.response?.data?.detail
    if (detail) {
      if (typeof detail === 'string') {
        error.message = detail
      } else if (Array.isArray(detail)) {
        error.message = detail
          .map((d) => {
            const loc = Array.isArray(d?.loc) ? d.loc.filter((p: unknown) => p !== 'body').join('.') : ''
            return loc ? `${loc}: ${d?.msg ?? ''}` : (d?.msg ?? JSON.stringify(d))
          })
          .join('; ')
      } else if (typeof detail === 'object') {
        error.message = detail.msg ?? JSON.stringify(detail)
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
