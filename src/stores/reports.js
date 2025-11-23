import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '../composables/useApi'

export const useReportsStore = defineStore('reports', () => {
  const dashboard = ref(null)
  const weekly = ref({})
  const loading = ref(false)
  const error = ref(null)
  const { api, extract } = useApi()

  async function fetchDashboard() {
    loading.value = true
    error.value = null
    try {
      dashboard.value = extract(await api.get('/reports/dashboard'))
    } catch (e) {
      error.value = e.response?.data || e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchWeekly(key) {
    loading.value = true
    error.value = null
    try {
      const data = extract(await api.get(`/reports/weekly/${key}`))
      weekly.value[key] = data
    } catch (e) {
      error.value = e.response?.data || e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary() {
    try {
      weekly.value.summary = extract(await api.get('/reports/weekly/summary'))
    } catch (e) {
      /* ignore */
    }
  }

  return { dashboard, weekly, loading, error, fetchDashboard, fetchWeekly, fetchSummary }
})
