import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '../composables/useApi'
import { useCaching, CacheKeys, CacheTTL } from '../composables/useCaching'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  // Backend returns role object with 'role_name'
  const role = computed(() => user.value?.role?.role_name || null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)
  const { api, extract } = useApi()
  const cache = useCaching()

  async function login(credentials) {
    loading.value = true
    error.value = null
    try {
      const data = extract(await api.post('/auth/login', credentials))
      token.value = data.token
      user.value = data.user
    } catch (e) {
      error.value = e.response?.data || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function registerBorrower(payload) {
    loading.value = true
    error.value = null
    try {
      const data = extract(await api.post('/auth/register', payload))
      token.value = data.token
      user.value = data.user
    } catch (e) {
      error.value = e.response?.data || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return

    try {
      // Try cache first (10-minute TTL for user profile)
      const cached = cache.get(CacheKeys.USER_PROFILE)

      if (cached) {
        user.value = cached
        return cached
      }

      // Fetch from API if not cached
      const data = extract(await api.get('/auth/me'))
      const userData = data.user || data
      user.value = userData

      // Cache user profile
      cache.set(CacheKeys.USER_PROFILE, userData, CacheTTL.MEDIUM)

      return userData
    } catch (e) {
      if (e.response?.status === 401) logout()
    }
  }

  async function logout() {
    if (token.value) {
      try {
        await api.post('/auth/logout')
      } catch {
        /* silent */
      }
    }
    token.value = null
    user.value = null

    // Clear all user-related caches on logout
    cache.invalidatePattern(/^user:/)
    cache.invalidatePattern(/^stats:/)
  }

  async function init() {
    if (initialized.value) return
    if (token.value && !user.value) {
      try {
        await fetchMe()
      } catch {
        /* ignore */
      }
    }
    initialized.value = true
  }

  const isAuthenticated = computed(() => !!token.value)
  const hasRole = (r) => role.value === r || (Array.isArray(r) && r.includes(role.value))

  return {
    token,
    user,
    role,
    isAuthenticated,
    hasRole,
    loading,
    error,
    initialized,
    login,
    registerBorrower,
    fetchMe,
    logout,
    init,
  }
})
