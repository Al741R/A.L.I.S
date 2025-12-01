import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '../composables/useApi'
import { useCaching, CacheKeys, CacheTTL } from '../composables/useCaching'

export const useBooksStore = defineStore('books', () => {
  const list = ref([])
  const current = ref(null)
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref(null)
  const { api, extract } = useApi()
  const cache = useCaching()

  async function fetchAll(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = extract(await api.get('/books', { params }))
      const raw = data.data || data
      list.value = sanitizeArray(raw)
      // Capture pagination meta if present (non-breaking for existing consumers)
      if (data && typeof data === 'object' && Array.isArray(data.data) && 'current_page' in data) {
        pagination.value = {
          current_page: data.current_page,
          last_page: data.last_page,
          per_page: data.per_page,
          total: data.total,
        }
      } else {
        pagination.value = null
      }
    } catch (e) {
      error.value = e.response?.data || e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id) {
    if (!id) return
    try {
      current.value = extract(await api.get(`/books/${id}`))
    } catch (e) {
      error.value = e.response?.data || e.message
    }
  }

  async function create(payload) {
    const data = extract(await api.post('/books', payload))
    const norm = normalizeBook(data)
    list.value.push(norm)

    // Invalidate related caches
    cache.invalidatePattern(/^stats:/)

    return norm
  }

  async function update(id, payload) {
    const data = extract(await api.put(`/books/${id}`, payload))
    const norm = normalizeBook(data)
    list.value = list.value.map((b) => (b.id === id ? norm : b))
    if (current.value?.id === id) current.value = norm

    // Invalidate related caches
    cache.invalidatePattern(/^stats:/)

    return norm
  }

  async function remove(id) {
    await api.delete(`/books/${id}`)
    list.value = list.value.filter((b) => b.id !== id)
    if (current.value?.id === id) current.value = null

    // Invalidate related caches
    cache.invalidatePattern(/^stats:/)
  }

  async function fetchCategories() {
    try {
      // Try to get categories from cache first (30-minute TTL)
      const cached = cache.get(CacheKeys.BOOK_CATEGORIES)

      if (cached) {
        categories.value = cached
        return cached
      }

      // Fetch from API if not cached
      const res = extract(await api.get('/categories?per_page=100'))
      const raw = res.data || res

      // Normalize categories separately (do NOT run book normalizer here)
      const normalized = Array.isArray(raw)
        ? raw
            .filter((c) => c && typeof c === 'object')
            .map((c) => ({ id: c.id, category_name: c.category_name }))
        : []

      categories.value = normalized

      // Cache for 30 minutes
      cache.set(CacheKeys.BOOK_CATEGORIES, normalized, CacheTTL.LONG)

      return normalized
    } catch {
      categories.value = []
    }
  }

  // --- Helpers ---
  function sanitizeArray(arr) {
    if (!Array.isArray(arr)) return []
    return arr.filter((x) => x && typeof x === 'object').map((x) => normalizeBook(x))
  }
  function normalizeBook(b) {
    if (!b || typeof b !== 'object') return b
    // Flatten category object to string if present
    let categoryValue = b.category
    if (categoryValue && typeof categoryValue === 'object') {
      categoryValue =
        categoryValue.category_name ||
        categoryValue.name ||
        categoryValue.title ||
        categoryValue.label ||
        categoryValue.slug ||
        categoryValue.code ||
        categoryValue.id ||
        ''
    }
    if (!categoryValue && b.category_name) categoryValue = b.category_name
    // Support alternate quantity field names from backend
    const rawCopies =
      b.copies ?? b.total_copies ?? b.quantity ?? b.qty ?? b.available_copies ?? b.stock
    const copies = typeof rawCopies === 'number' ? rawCopies : Number(rawCopies) || 0
    const borrowedRaw = b.borrowed_count ?? b.borrowed ?? b.out ?? null
    const borrowedCount =
      borrowedRaw != null
        ? typeof borrowedRaw === 'number'
          ? borrowedRaw
          : Number(borrowedRaw) || 0
        : null
    const totalNumeric =
      typeof b.total_copies === 'number' ? b.total_copies : Number(b.total_copies) || copies
    const availNumeric =
      typeof b.available_copies === 'number'
        ? b.available_copies
        : Number(b.available_copies) || totalNumeric - (borrowedCount ?? 0)

    // Derive borrowed_count if backend did not supply a usable value
    const derivedBorrowed =
      borrowedCount == null ? Math.max(0, totalNumeric - availNumeric) : borrowedCount
    // Flag anomalies where available exceeds total or goes negative
    const inventoryAnomaly = availNumeric > totalNumeric || availNumeric < 0
    return {
      ...b,
      category: categoryValue || '',
      copies,
      _borrowed_count: derivedBorrowed, // legacy internal
      borrowed_count: derivedBorrowed, // canonical for components
      total_copies: totalNumeric,
      available_copies: availNumeric,
      inventory_anomaly: inventoryAnomaly,
    }
  }

  return {
    list,
    current,
    categories,
    loading,
    error,
    pagination,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    fetchCategories,
  }
})
