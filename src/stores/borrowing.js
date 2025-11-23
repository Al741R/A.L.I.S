import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '../composables/useApi'
import { useAuthStore } from './auth'

export const useBorrowingStore = defineStore('borrowing', () => {
  const transactions = ref([])
  const current = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const { api, extract } = useApi()
  const auth = useAuthStore()

  async function fetchTransactions(params = {}) {
    loading.value = true
    error.value = null
    try {
      // Borrowers fetch only their own transactions via scoped endpoint
      const endpoint = auth.role === 'Borrower' ? '/my/borrow-transactions' : '/borrow-transactions'
      const data = extract(await api.get(endpoint, { params }))
      transactions.value = data.data || data
    } catch (e) {
      error.value = e.response?.data || e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id) {
    try {
      current.value = extract(await api.get(`/borrow-transactions/${id}`))
    } catch (e) {
      error.value = e.response?.data || e.message
    }
  }

  async function createBorrow(payload) {
    const data = extract(await api.post('/borrow-transactions', payload))
    transactions.value.unshift(data)
    return data
  }

  async function updateBorrow(id, payload) {
    const data = extract(await api.put(`/borrow-transactions/${id}`, payload))
    transactions.value = transactions.value.map((t) => (t.id === id ? data : t))
    if (current.value?.id === id) current.value = data
    return data
  }

  async function returnBook(id) {
    const data = extract(await api.post(`/borrow-transactions/${id}/return`))
    transactions.value = transactions.value.map((t) => (t.id === id ? data : t))
    if (current.value?.id === id) current.value = data
    return data
  }

  async function requestReturn(id) {
    const data = extract(await api.post(`/borrow-transactions/${id}/request-return`))
    transactions.value = transactions.value.map((t) => (t.id === id ? data : t))
    if (current.value?.id === id) current.value = data
    return data
  }

  return {
    transactions,
    current,
    loading,
    error,
    fetchTransactions,
    fetchOne,
    createBorrow,
    updateBorrow,
    returnBook,
    requestReturn,
  }
})
