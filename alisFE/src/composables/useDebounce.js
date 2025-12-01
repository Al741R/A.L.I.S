import { ref, watch } from 'vue'

/**
 * Debounce composable to delay function execution until after wait milliseconds
 * have elapsed since the last time it was invoked
 * @param {Function} fn - The function to debounce
 * @param {Number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} - Debounced function
 */
export function useDebounce(fn, delay = 300) {
  let timeoutId = null

  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * Debounced ref - wraps a ref and provides a debounced value
 * @param {any} initialValue - Initial value
 * @param {Number} delay - Delay in milliseconds (default: 300)
 * @returns {Object} - Object with value ref and debouncedValue ref
 */
export function useDebouncedRef(initialValue, delay = 300) {
  const value = ref(initialValue)
  const debouncedValue = ref(initialValue)
  let timeoutId = null

  watch(value, (newVal) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      debouncedValue.value = newVal
    }, delay)
  })

  return { value, debouncedValue }
}
