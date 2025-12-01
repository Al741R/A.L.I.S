import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'

export const useBorrowRequestsStore = defineStore('borrowRequests', {
  state: () => ({
    list: [],
    myList: [],
    loading: false,
    creating: false,
    approvingId: null,
    denyingId: null,
  }),
  getters: {
    pending: (s) => (Array.isArray(s.list) ? s.list.filter((r) => r.status === 'Pending') : []),
    hasPendingFor: (s) => (bookId) =>
      Array.isArray(s.myList)
        ? s.myList.some((r) => r.book_id === bookId && r.status === 'Pending')
        : false,
  },
  actions: {
    async fetchAll(params = {}) {
      this.loading = true
      try {
        const { api } = useApi()
        const res = await api.get('/borrow-requests', { params })
        const payload = res.data?.data ?? res.data
        this.list = Array.isArray(payload) ? payload : []
      } catch (e) {
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    async fetchMine(params = {}) {
      this.loading = true
      try {
        const { api } = useApi()
        const res = await api.get('/my/borrow-requests', { params })
        const payload = res.data?.data ?? res.data
        this.myList = Array.isArray(payload) ? payload : []
      } catch (e) {
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    async createRequest(bookId) {
      if (!bookId) return
      this.creating = true
      const notify = useNotificationsStore()
      try {
        const { api } = useApi()
        const res = await api.post('/borrow-requests', { book_id: bookId })
        const payload = res.data?.request ?? res.data
        if (payload) this.myList.unshift(payload)
        notify.push('Borrow request submitted.', { type: 'success' })
      } catch (e) {
        notify.push(e.response?.data?.message || 'Request failed.', { type: 'error' })
      } finally {
        this.creating = false
      }
    },
    async approve(id) {
      if (!id) return
      this.approvingId = id
      const notify = useNotificationsStore()
      try {
        const { api } = useApi()
        const res = await api.post(`/borrow-requests/${id}/approve`)
        this.list = this.list.map((r) => (r.id === id ? res.data.request : r))
        notify.push('Borrow request approved.', { type: 'success' })
      } catch (e) {
        notify.push(e.response?.data?.message || 'Approve failed.', { type: 'error' })
      } finally {
        this.approvingId = null
      }
    },
    async deny(id) {
      if (!id) return
      this.denyingId = id
      const notify = useNotificationsStore()
      try {
        const { api } = useApi()
        const res = await api.post(`/borrow-requests/${id}/deny`)
        this.list = this.list.map((r) => (r.id === id ? res.data : r))
        notify.push('Borrow request denied.', { type: 'info' })
      } catch (e) {
        notify.push(e.response?.data?.message || 'Deny failed.', { type: 'error' })
      } finally {
        this.denyingId = null
      }
    },
  },
})
