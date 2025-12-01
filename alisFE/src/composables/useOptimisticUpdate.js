import { ref } from 'vue'

/**
 * Optimistic UI updates composable
 * Updates UI immediately and rolls back on error
 */
export function useOptimisticUpdate() {
  const pendingUpdates = ref(new Map())

  /**
   * Perform optimistic update
   * @param {String} key - Unique identifier for the update
   * @param {Function} optimisticFn - Function to update UI immediately
   * @param {Function} apiFn - Async function that performs the actual API call
   * @param {Function} rollbackFn - Function to revert changes on error
   * @returns {Promise} - Resolves with API result or rejects with error
   */
  async function update(key, optimisticFn, apiFn, rollbackFn) {
    // Check if update is already in progress
    if (pendingUpdates.value.has(key)) {
      throw new Error('Update already in progress')
    }

    // Mark as pending
    pendingUpdates.value.set(key, true)

    // Apply optimistic update immediately
    const rollbackData = optimisticFn()

    try {
      // Perform actual API call
      const result = await apiFn()

      // Remove from pending
      pendingUpdates.value.delete(key)

      return result
    } catch (error) {
      // Rollback optimistic update
      if (rollbackFn) {
        rollbackFn(rollbackData)
      }

      // Remove from pending
      pendingUpdates.value.delete(key)

      throw error
    }
  }

  /**
   * Check if update is pending
   * @param {String} key
   * @returns {Boolean}
   */
  function isPending(key) {
    return pendingUpdates.value.has(key)
  }

  /**
   * Clear all pending updates
   */
  function clearPending() {
    pendingUpdates.value.clear()
  }

  return {
    update,
    isPending,
    clearPending,
    pendingUpdates,
  }
}

/**
 * Simplified optimistic update for common patterns
 */
export function useSimpleOptimistic() {
  /**
   * Optimistically add item to list
   * @param {Array} list - Reactive array
   * @param {Object} item - Item to add
   * @param {Function} apiFn - API function that returns created item
   * @returns {Promise}
   */
  async function optimisticAdd(list, item, apiFn) {
    // Add with temporary ID
    const tempId = `temp-${Date.now()}`
    const tempItem = { ...item, id: tempId, _optimistic: true }
    list.push(tempItem)

    try {
      const created = await apiFn(item)

      // Replace temp item with real one
      const index = list.findIndex((i) => i.id === tempId)
      if (index !== -1) {
        list[index] = created
      }

      return created
    } catch (error) {
      // Remove temp item on error
      const index = list.findIndex((i) => i.id === tempId)
      if (index !== -1) {
        list.splice(index, 1)
      }
      throw error
    }
  }

  /**
   * Optimistically update item in list
   * @param {Array} list - Reactive array
   * @param {String|Number} id - Item ID
   * @param {Object} updates - Updates to apply
   * @param {Function} apiFn - API function
   * @returns {Promise}
   */
  async function optimisticUpdate(list, id, updates, apiFn) {
    const index = list.findIndex((i) => i.id === id)
    if (index === -1) throw new Error('Item not found')

    // Store original
    const original = { ...list[index] }

    // Apply updates immediately
    list[index] = { ...list[index], ...updates, _optimistic: true }

    try {
      const updated = await apiFn(id, updates)

      // Replace with server response
      list[index] = updated

      return updated
    } catch (error) {
      // Rollback to original
      list[index] = original
      throw error
    }
  }

  /**
   * Optimistically remove item from list
   * @param {Array} list - Reactive array
   * @param {String|Number} id - Item ID
   * @param {Function} apiFn - API function
   * @returns {Promise}
   */
  async function optimisticRemove(list, id, apiFn) {
    const index = list.findIndex((i) => i.id === id)
    if (index === -1) throw new Error('Item not found')

    // Store original
    const original = list[index]

    // Remove immediately
    list.splice(index, 1)

    try {
      await apiFn(id)
      return true
    } catch (error) {
      // Restore on error
      list.splice(index, 0, original)
      throw error
    }
  }

  return {
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
  }
}
