import { useAnalyticsStore } from '@/stores/analytics'

/**
 * Analytics composable for easy integration in components
 * Provides convenient methods for tracking user interactions
 *
 * @example
 * const analytics = useAnalytics()
 *
 * // Track button click
 * analytics.trackClick('export-button', { format: 'csv' })
 *
 * // Track form submission
 * analytics.trackFormSubmit('book-create-form', { success: true })
 *
 * // Track search
 * analytics.trackSearch('science fiction', 42)
 */
export function useAnalytics() {
  const store = useAnalyticsStore()

  /**
   * Track button click
   * @param {string} buttonId - Button identifier
   * @param {Object} metadata - Additional data
   */
  function trackClick(buttonId, metadata = {}) {
    store.trackInteraction('button', buttonId, metadata)
  }

  /**
   * Track link click
   * @param {string} linkId - Link identifier
   * @param {string} destination - Link destination
   */
  function trackLinkClick(linkId, destination) {
    store.trackInteraction('link', linkId, { destination })
  }

  /**
   * Track form submission
   * @param {string} formId - Form identifier
   * @param {boolean} success - Whether submission was successful
   * @param {Object} metadata - Additional data
   */
  function trackFormSubmit(formId, success = true, metadata = {}) {
    store.trackEvent(
      'form',
      'submit',
      formId,
      success ? 1 : 0,
      Object.assign({}, metadata, {
        success,
      }),
    )
  }

  /**
   * Track form validation error
   * @param {string} formId - Form identifier
   * @param {Array} errors - List of validation errors
   */
  function trackFormError(formId, errors) {
    store.trackEvent('form', 'validation_error', formId, errors.length, {
      errors,
    })
  }

  /**
   * Track modal open/close
   * @param {string} modalId - Modal identifier
   * @param {string} action - 'open' or 'close'
   */
  function trackModal(modalId, action) {
    store.trackEvent('modal', action, modalId)
  }

  /**
   * Track tab change
   * @param {string} tabId - Tab identifier
   * @param {string} fromTab - Previous tab
   * @param {string} toTab - New tab
   */
  function trackTabChange(tabId, fromTab, toTab) {
    store.trackEvent('navigation', 'tab_change', tabId, null, {
      from: fromTab,
      to: toTab,
    })
  }

  /**
   * Track file upload
   * @param {string} fileType - File type/extension
   * @param {number} fileSize - File size in bytes
   */
  function trackFileUpload(fileType, fileSize) {
    store.trackEvent('file', 'upload', fileType, fileSize, {
      size: fileSize,
      type: fileType,
    })
  }

  /**
   * Track download
   * @param {string} filename - Downloaded file name
   * @param {string} format - File format (csv, pdf, etc.)
   */
  function trackDownload(filename, format) {
    store.trackEvent('file', 'download', format, null, {
      filename,
      format,
    })
  }

  /**
   * Track API call
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} duration - Request duration in ms
   * @param {boolean} success - Whether request was successful
   */
  function trackApiCall(endpoint, method, duration, success = true) {
    store.trackPerformance('api_call', duration, {
      endpoint,
      method,
      success,
    })
  }

  /**
   * Track CRUD operation
   * @param {string} resource - Resource name (e.g., 'book', 'user')
   * @param {string} operation - Operation type (create, read, update, delete)
   * @param {boolean} success - Whether operation was successful
   */
  function trackCrudOperation(resource, operation, success = true) {
    store.trackEvent('crud', operation, resource, success ? 1 : 0, {
      success,
    })
  }

  /**
   * Track filter usage
   * @param {string} filterType - Type of filter applied
   * @param {Object} filters - Applied filters
   */
  function trackFilter(filterType, filters) {
    store.trackEvent('filter', 'apply', filterType, null, filters)
  }

  /**
   * Track sort operation
   * @param {string} column - Column being sorted
   * @param {string} direction - Sort direction (asc/desc)
   */
  function trackSort(column, direction) {
    store.trackEvent('sort', 'apply', column, null, { direction })
  }

  /**
   * Track pagination
   * @param {number} page - Current page number
   * @param {number} perPage - Items per page
   */
  function trackPagination(page, perPage) {
    store.trackEvent('pagination', 'navigate', null, page, { perPage })
  }

  /**
   * Track feature usage
   * @param {string} featureName - Feature identifier
   * @param {Object} metadata - Additional data
   */
  function trackFeature(featureName, metadata = {}) {
    store.trackEvent('feature', 'use', featureName, 1, metadata)
  }

  /**
   * Track user preference change
   * @param {string} preferenceName - Preference identifier
   * @param {any} value - New value
   */
  function trackPreference(preferenceName, value) {
    store.trackEvent('preference', 'change', preferenceName, null, { value })
  }

  /**
   * Start performance timer
   * @param {string} label - Timer label
   * @returns {Function} Function to end timer
   */
  function startTimer(label) {
    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime
      store.trackPerformance(label, duration)
    }
  }

  /**
   * Track time spent on action
   * @param {string} action - Action name
   * @param {Function} callback - Action to perform
   * @returns {Promise<any>} Result of callback
   */
  async function trackTimed(action, callback) {
    const endTimer = startTimer(action)
    try {
      const result = await callback()
      endTimer()
      return result
    } catch (error) {
      endTimer()
      throw error
    }
  }

  return {
    // Store methods
    ...store,

    // Convenience methods
    trackClick,
    trackLinkClick,
    trackFormSubmit,
    trackFormError,
    trackModal,
    trackTabChange,
    trackFileUpload,
    trackDownload,
    trackApiCall,
    trackCrudOperation,
    trackFilter,
    trackSort,
    trackPagination,
    trackFeature,
    trackPreference,
    startTimer,
    trackTimed,
  }
}
