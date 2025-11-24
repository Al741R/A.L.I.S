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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(covers.value))
  }

  function setCover(bookId, dataUrlOrUrl) {
    if (!bookId || !dataUrlOrUrl) return
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

  load()

  return { covers, setCover, removeCover, coverFor, clearAll, exportJson, importJson }
})
