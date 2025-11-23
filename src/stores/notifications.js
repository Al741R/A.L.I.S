import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

let idCounter = 0

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])

  // Load persisted (non-ephemeral) notifications on init
  const persistedRaw = localStorage.getItem('alis_notifications')
  if (persistedRaw) {
    try {
      const parsed = JSON.parse(persistedRaw)
      if (Array.isArray(parsed)) {
        // Only restore notes explicitly marked persistent
        items.value = parsed.filter((n) => n.persist)
      }
    } catch {}
  }

  function push(message, { type = 'info', timeout = 4000, persist = false } = {}) {
    const id = ++idCounter
    const note = { id, message, type, persist }
    items.value.push(note)
    if (timeout > 0 && !persist) {
      setTimeout(() => remove(id), timeout)
    }
    persistState()
    return id
  }

  function remove(id) {
    items.value = items.value.filter((n) => n.id !== id)
    persistState()
  }

  function clear() {
    items.value = []
    persistState()
  }

  function persistState() {
    try {
      const toStore = items.value.filter((n) => n.persist)
      localStorage.setItem('alis_notifications', JSON.stringify(toStore))
    } catch {}
  }

  // Watch for manual edits (unlikely) and persist
  watch(items, () => persistState(), { deep: true })

  return { items, push, remove, clear }
})
