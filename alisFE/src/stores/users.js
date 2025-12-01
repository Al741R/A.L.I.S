import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '../composables/useApi'

export const useUsersStore = defineStore('users', () => {
  const list = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { api, extract } = useApi()

  async function fetchAll(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = extract(await api.get('/users', { params }))
      // pagination aware
      list.value = Array.isArray(data.data) ? normalizeArray(data.data) : normalizeArray(data)
    } catch (e) {
      error.value = e.response?.data || e.message
    } finally {
      loading.value = false
    }
  }

  function normalizeArray(arr) {
    return arr.filter(Boolean).map(normalizeUser)
  }

  function normalizeUser(u) {
    if (!u || typeof u !== 'object') return u
    const roleName = u.role?.role_name || u.role_name || ''
    return {
      ...u,
      role_name: roleName,
      full_name: [u.first_name, u.last_name].filter(Boolean).join(' '),
    }
  }

  const borrowers = computed(() => list.value.filter((u) => u.role_name === 'Borrower'))

  return { list, borrowers, loading, error, fetchAll }
})
