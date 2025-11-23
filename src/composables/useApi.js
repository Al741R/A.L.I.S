import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// Central axios instance + helpers
export function useApi() {
  const auth = useAuthStore()

  const api = axios.create({
    baseURL:
      import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000/api/v1',
    timeout: 15000,
  })

  api.interceptors.request.use((config) => {
    const rawToken = typeof auth.token === 'string' ? auth.token : auth.token?.value
    if (rawToken && !/\/auth\/(login|register)$/.test(config.url)) {
      config.headers.Authorization = `Bearer ${rawToken}`
    }
    config.headers.Accept = 'application/json'
    if (import.meta.env.DEV) {
      // Debug request log
      console.debug('[API REQUEST]', config.method?.toUpperCase(), config.url, {
        hasAuth: !!rawToken && !/\/auth\/(login|register)$/.test(config.url),
      })
    }
    return config
  })

  api.interceptors.response.use(
    (r) => r,
    (error) => {
      if (import.meta.env.DEV) {
        console.debug(
          '[API ERROR]',
          error.config?.url,
          error.response?.status,
          error.response?.data,
        )
      }
      const currentToken = typeof auth.token === 'string' ? auth.token : auth.token?.value
      if (error.response?.status === 401 && currentToken) {
        auth.logout()
      }
      throw error
    },
  )

  const extract = (res) => res.data

  return { api, extract }
}
