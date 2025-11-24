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
      // Borrowers fetch only their own transactions; librarians/admin need broader view.
      const endpoint = auth.role === 'Borrower' ? '/my/borrow-transactions' : '/borrow-transactions'
      // Ensure we request enough rows so older overdue items are included (backend default 15 is too small).
      const merged = { per_page: 500, ...params }
      const data = extract(await api.get(endpoint, { params: merged }))
      transactions.value = data.data || data
    } catch (e) {
      error.value = e.response?.data || e.message
    } finally {
      loading.value = false
    }
  }

  // Fetch active (Borrowed + Overdue) by merging borrowed status and overdue param pages.
  async function fetchActiveTransactions() {
    loading.value = true
    error.value = null
    try {
      const endpoint = auth.role === 'Borrower' ? '/my/borrow-transactions' : '/borrow-transactions'
      const borrowedResp = extract(
        await api.get(endpoint, { params: { status: 'Borrowed', per_page: 500 } }),
      )
      const overdueResp = extract(
        await api.get(endpoint, { params: { overdue: 1, per_page: 500 } }),
      )
      // Also fetch return requested items so they persist in UI request center.
      const returnReqResp = extract(
        await api.get(endpoint, { params: { status: 'ReturnRequested', per_page: 500 } }),
      )
      const toArr = (r) => (Array.isArray(r.data) ? r.data : r.data || r)
      const mergedMap = new Map()
      ;[...toArr(borrowedResp), ...toArr(overdueResp), ...toArr(returnReqResp)].forEach((tx) => {
        if (tx && tx.id != null) mergedMap.set(tx.id, tx)
      })
      transactions.value = Array.from(mergedMap.values())
    } catch (e) {
      error.value = e.response?.data || e.message
    } finally {
      loading.value = false
    }
  }

  // Fetch all pages to avoid losing overdue items sitting on later pages.
  async function fetchAllTransactions(params = {}) {
    loading.value = true
    error.value = null
    try {
      const endpoint = auth.role === 'Borrower' ? '/my/borrow-transactions' : '/borrow-transactions'
      const merged = { per_page: params.per_page || 100, ...params }
      let page = 1
      let all = []
      while (true) {
        const resp = extract(await api.get(endpoint, { params: { ...merged, page } }))
        const chunk = resp.data || resp.data === undefined ? resp.data : resp
        if (Array.isArray(chunk)) {
          all = all.concat(chunk)
        } else if (Array.isArray(resp?.data)) {
          all = all.concat(resp.data)
        }
        const next = resp.next_page_url
        if (!next) break
        page += 1
        // Safety cap to prevent infinite loops
        if (page > 50) break
      }
      transactions.value = all
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

  async function returnBook(id, dateReturned = new Date().toISOString().split('T')[0]) {
    const data = extract(
      await api.post(`/borrow-transactions/${id}/return`, { date_returned: dateReturned }),
    )
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

  // Local placeholder borrow request (pending librarian approval). If backend supports it,
  // replace with an API call; otherwise we keep a synthetic transaction with status BorrowRequested.
  function requestBorrowLocal(book) {
    if (!book || !auth.user) return null
    // Prevent duplicate pending request for same book & user
    const exists = transactions.value.find(
      (t) => t.book_id === book.id && t.user_id === auth.user.id && t.status === 'BorrowRequested',
    )
    if (exists) return exists
    const now = new Date().toISOString()
    const tx = {
      id: `local-${Date.now()}-${book.id}`,
      book_id: book.id,
      user_id: auth.user.id,
      book,
      status: 'BorrowRequested',
      date_borrowed: null, // to be assigned by librarian
      due_date: null, // to be assigned by librarian
      created_at: now,
      updated_at: now,
    }
    transactions.value.unshift(tx)
    return tx
  }

  function pendingBorrowFor(bookId) {
    if (!auth.user) return null
    return transactions.value.find(
      (t) => t.book_id === bookId && t.user_id === auth.user.id && t.status === 'BorrowRequested',
    )
  }

  return {
    transactions,
    current,
    loading,
    error,
    fetchTransactions,
    fetchActiveTransactions,
    fetchAllTransactions,
    fetchOne,
    createBorrow,
    updateBorrow,
    returnBook,
    requestReturn,
    requestBorrowLocal,
    pendingBorrowFor,
  }
})
