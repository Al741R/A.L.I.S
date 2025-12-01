import { ref } from 'vue'

/**
 * Loading state manager composable
 * Manages multiple concurrent loading states
 */
export function useLoadingState() {
  const loadingStates = ref(new Map())

  /**
   * Start loading for a specific key
   * @param {String} key - Loading state identifier
   */
  function startLoading(key = 'default') {
    loadingStates.value.set(key, true)
  }

  /**
   * Stop loading for a specific key
   * @param {String} key - Loading state identifier
   */
  function stopLoading(key = 'default') {
    loadingStates.value.set(key, false)
  }

  /**
   * Check if loading for a specific key
   * @param {String} key - Loading state identifier
   * @returns {Boolean}
   */
  function isLoading(key = 'default') {
    return loadingStates.value.get(key) === true
  }

  /**
   * Check if any loading state is active
   * @returns {Boolean}
   */
  function isAnyLoading() {
    return Array.from(loadingStates.value.values()).some((state) => state === true)
  }

  /**
   * Wrap async function with loading state
   * @param {String} key - Loading state identifier
   * @param {Function} fn - Async function to wrap
   * @returns {Function} - Wrapped function
   */
  function withLoading(key, fn) {
    return async (...args) => {
      startLoading(key)
      try {
        return await fn(...args)
      } finally {
        stopLoading(key)
      }
    }
  }

  /**
   * Clear all loading states
   */
  function clearAll() {
    loadingStates.value.clear()
  }

  return {
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    withLoading,
    clearAll,
    loadingStates,
  }
}
