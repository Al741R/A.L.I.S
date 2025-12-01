import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '../composables/useApi'

export const useActivityStore = defineStore('activity', () => {
  const logs = ref([])
  const current = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const { api, extract } = useApi()

  async function fetchLogs(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = extract(await api.get('/activity-logs', { params }))
      logs.value = data.data || data
    } catch (e) {
      error.value = e.response?.data || e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id) {
    try {
      current.value = extract(await api.get(`/activity-logs/${id}`))
    } catch (e) {
      error.value = e.response?.data || e.message
    }
  }

  return { logs, current, loading, error, fetchLogs, fetchOne }
})
