import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// Central axios instance + helpers
export function useApi() {
  const auth = useAuthStore()

  // Resolve base URL precedence:
  // 1. Explicit env var VITE_API_BASE_URL (no trailing slash)
  // 2. Dev fallback: if running on :5173 assume backend on :8000/api/v1
  // 3. Default localhost:8000/api/v1
  const explicit = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  let devFallback = null
  if (!explicit && import.meta.env.DEV && typeof window !== 'undefined') {
    try {
      const u = new URL(window.location.href)
      if (u.port === '5173') {
        u.port = '8000'
        devFallback = `${u.origin}/api/v1`
      }
    } catch {
      /* silent */
    }
  }
  const baseURL = explicit || devFallback || 'http://localhost:8000/api/v1'

  const api = axios.create({
    baseURL,
    timeout: 15000,
  })

  api.interceptors.request.use((config) => {
    const rawToken = typeof auth.token === 'string' ? auth.token : auth.token?.value
    if (rawToken && !/\/auth\/(login|register)$/.test(config.url)) {
      config.headers.Authorization = `Bearer ${rawToken}`
    }
    config.headers.Accept = 'application/json'
    if (import.meta.env.DEV) {
      console.debug('[API REQUEST]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        resolved: `${config.baseURL || ''}${config.url || ''}`,
        hasAuth: !!rawToken && !/\/auth\/(login|register)$/.test(config.url),
      })
    }
    return config
  })

  api.interceptors.response.use(
    (r) => r,
    (error) => {
      if (import.meta.env.DEV) {
        console.debug('[API ERROR]', {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          status: error.response?.status,
          data: error.response?.data,
        })
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
