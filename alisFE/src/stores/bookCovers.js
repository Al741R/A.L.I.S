import { defineStore } from 'pinia'
import { ref } from 'vue'

// Frontend-only book cover storage (localStorage)
// Persists data URL or external URL strings keyed by book id.
// NOTE: Clearing browser storage or using a different browser will lose covers.
const STORAGE_KEY = 'alis_book_covers'

export const useBookCoversStore = defineStore('bookCovers', () => {
  const covers = ref({}) // { [bookId]: dataUrl|string }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (raw && typeof raw === 'object') covers.value = raw
    } catch {
      covers.value = {}
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(covers.value))
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        // Storage quota exceeded - try to clean up old entries
        console.warn('localStorage quota exceeded, attempting cleanup...')
        cleanupOldCovers()
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(covers.value))
        } catch (retryErr) {
          console.error('Failed to save covers even after cleanup:', retryErr)
          alert('Storage limit reached. Please clear some book covers or use smaller images.')
        }
      } else {
        console.error('Failed to save book covers:', err)
      }
    }
  }

  function cleanupOldCovers() {
    // Remove covers that are no longer needed (oldest first)
    const entries = Object.entries(covers.value)
    if (entries.length > 50) {
      // Keep only the 50 most recent
      const sorted = entries.slice(-50)
      covers.value = Object.fromEntries(sorted)
      console.log(`Cleaned up old covers, kept ${sorted.length} most recent`)
    }
  }

  function setCover(bookId, dataUrlOrUrl) {
    if (!bookId || !dataUrlOrUrl) return
    // Compress data URLs if they're too large (> 500KB)
    if (typeof dataUrlOrUrl === 'string' && dataUrlOrUrl.startsWith('data:image/')) {
      const sizeInBytes = (dataUrlOrUrl.length * 3) / 4 // Approximate base64 size
      if (sizeInBytes > 500 * 1024) {
        console.warn(
          `Large image detected (${(sizeInBytes / 1024).toFixed(0)}KB). Consider using smaller images.`,
        )
      }
    }
    covers.value[bookId] = dataUrlOrUrl
    save()
  }
  function removeCover(bookId) {
    if (!bookId) return
    delete covers.value[bookId]
    save()
  }
  function coverFor(bookId) {
    return covers.value[bookId] || null
  }
  function clearAll() {
    covers.value = {}
    save()
  }

  function exportJson() {
    return JSON.stringify(covers.value, null, 2)
  }
  function importJson(obj) {
    try {
      const data = typeof obj === 'string' ? JSON.parse(obj) : obj
      if (data && typeof data === 'object') {
        covers.value = { ...covers.value, ...data }
        save()
      }
    } catch {
      // ignore invalid
    }
  }

  function getStorageSize() {
    try {
      const data = JSON.stringify(covers.value)
      const sizeInBytes = new Blob([data]).size
      return {
        bytes: sizeInBytes,
        kb: (sizeInBytes / 1024).toFixed(2),
        mb: (sizeInBytes / (1024 * 1024)).toFixed(2),
        count: Object.keys(covers.value).length,
      }
    } catch {
      return { bytes: 0, kb: '0', mb: '0', count: 0 }
    }
  }

  load()

  return {
    covers,
    setCover,
    removeCover,
    coverFor,
    clearAll,
    exportJson,
    importJson,
    cleanupOldCovers,
    getStorageSize,
  }
})
