import { ref } from 'vue'

/**
 * Client-side data caching with TTL (Time To Live)
 * Reduces redundant API calls by caching frequently accessed data
 *
 * @example
 * const cache = useCaching()
 *
 * // Cache data with 5-minute TTL
 * cache.set('categories', categoriesData, 300000)
 *
 * // Retrieve cached data
 * const categories = cache.get('categories')
 *
 * // Cache with default TTL (10 minutes)
 * cache.set('userProfile', userData)
 */

// Cache storage
const cacheStore = ref(new Map())

// Default TTL: 10 minutes (in milliseconds)
const DEFAULT_TTL = 10 * 60 * 1000

export function useCaching() {
  /**
   * Set data in cache with TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (default: 10 minutes)
   */
  const set = (key, data, ttl = DEFAULT_TTL) => {
    const expiresAt = Date.now() + ttl

    cacheStore.value.set(key, {
      data,
      expiresAt,
      cachedAt: Date.now(),
    })
  }

  /**
   * Get data from cache
   * Returns null if not found or expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null
   */
  const get = (key) => {
    const cached = cacheStore.value.get(key)

    if (!cached) {
      return null
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      cacheStore.value.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Check if cache key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  const has = (key) => {
    const cached = cacheStore.value.get(key)

    if (!cached) {
      return false
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      cacheStore.value.delete(key)
      return false
    }

    return true
  }

  /**
   * Remove specific cache entry
   * @param {string} key - Cache key
   */
  const remove = (key) => {
    cacheStore.value.delete(key)
  }

  /**
   * Clear all cache
   */
  const clear = () => {
    cacheStore.value.clear()
  }

  /**
   * Get or set pattern: retrieve from cache or execute callback and cache result
   * @param {string} key - Cache key
   * @param {Function} callback - Async function to execute if cache miss
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>}
   */
  const getOrSet = async (key, callback, ttl = DEFAULT_TTL) => {
    const cached = get(key)

    if (cached !== null) {
      return cached
    }

    try {
      const data = await callback()
      set(key, data, ttl)
      return data
    } catch (error) {
      console.error(`Cache getOrSet error for key "${key}":`, error)
      throw error
    }
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string|RegExp} pattern - Pattern to match keys
   */
  const invalidatePattern = (pattern) => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    const keysToDelete = []

    for (const key of cacheStore.value.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => cacheStore.value.delete(key))

    return keysToDelete.length
  }

  /**
   * Get cache statistics
   * @returns {Object} Stats including size, oldest entry, etc.
   */
  const getStats = () => {
    const entries = Array.from(cacheStore.value.entries())

    if (entries.length === 0) {
      return {
        size: 0,
        entries: [],
        totalSize: 0,
      }
    }

    const now = Date.now()
    const stats = entries.map(([key, value]) => ({
      key,
      age: now - value.cachedAt,
      ttl: value.expiresAt - now,
      expired: now > value.expiresAt,
    }))

    return {
      size: entries.length,
      entries: stats,
      totalSize: JSON.stringify(Array.from(cacheStore.value.values())).length,
    }
  }

  /**
   * Clean up expired entries
   * @returns {number} Number of entries removed
   */
  const cleanup = () => {
    const now = Date.now()
    let removed = 0

    for (const [key, value] of cacheStore.value.entries()) {
      if (now > value.expiresAt) {
        cacheStore.value.delete(key)
        removed++
      }
    }

    return removed
  }

  /**
   * Refresh cache entry TTL without changing data
   * @param {string} key - Cache key
   * @param {number} ttl - New TTL in milliseconds
   */
  const refresh = (key, ttl = DEFAULT_TTL) => {
    const cached = cacheStore.value.get(key)

    if (cached) {
      cached.expiresAt = Date.now() + ttl
      cacheStore.value.set(key, cached)
      return true
    }

    return false
  }

  return {
    set,
    get,
    has,
    remove,
    clear,
    getOrSet,
    invalidatePattern,
    getStats,
    cleanup,
    refresh,
  }
}

/**
 * Cache keys constants for consistency
 */
export const CacheKeys = {
  // User data
  USER_PROFILE: 'user:profile',
  USER_PERMISSIONS: 'user:permissions',

  // Categories
  BOOK_CATEGORIES: 'books:categories',

  // Statistics (shorter TTL)
  DASHBOARD_STATS: 'stats:dashboard',
  BORROWING_STATS: 'stats:borrowing',

  // Reports (can be longer TTL)
  MONTHLY_REPORT: 'reports:monthly',
  ANNUAL_REPORT: 'reports:annual',

  // Lookups (can be very long TTL)
  ROLES: 'system:roles',
  STATUSES: 'system:statuses',
}

/**
 * Predefined TTL values in milliseconds
 */
export const CacheTTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes
  MEDIUM: 10 * 60 * 1000, // 10 minutes (default)
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
}
