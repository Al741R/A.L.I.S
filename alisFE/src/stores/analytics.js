import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Analytics store for tracking user actions and system usage
 * Provides insights into user behavior and system performance
 */
export const useAnalyticsStore = defineStore('analytics', () => {
  const events = ref([])
  const sessions = ref([])
  const currentSession = ref(null)
  const enabled = ref(true)

  /**
   * Initialize analytics session
   */
  function initSession() {
    currentSession.value = {
      id: generateSessionId(),
      startedAt: new Date(),
      userId: null,
      userRole: null,
      events: [],
      pageViews: [],
      interactions: 0,
    }

    sessions.value.push(currentSession.value)

    // Persist session
    saveToLocalStorage()
  }

  /**
   * Track page view
   * @param {string} path - Page path
   * @param {string} title - Page title
   */
  function trackPageView(path, title) {
    if (!enabled.value || !currentSession.value) return

    const pageView = {
      type: 'page_view',
      path,
      title,
      timestamp: new Date(),
      referrer: document.referrer,
      sessionId: currentSession.value.id,
    }

    events.value.push(pageView)
    currentSession.value.pageViews.push(pageView)

    saveToLocalStorage()
  }

  /**
   * Track user action/event
   * @param {string} category - Event category (e.g., 'books', 'borrowing')
   * @param {string} action - Action name (e.g., 'create', 'update', 'delete')
   * @param {string} label - Optional label
   * @param {number} value - Optional numeric value
   * @param {Object} metadata - Additional metadata
   */
  function trackEvent(category, action, label = null, value = null, metadata = {}) {
    if (!enabled.value || !currentSession.value) return

    const event = {
      type: 'event',
      category,
      action,
      label,
      value,
      metadata,
      timestamp: new Date(),
      sessionId: currentSession.value.id,
    }

    events.value.push(event)
    currentSession.value.events.push(event)
    currentSession.value.interactions++

    saveToLocalStorage()
  }

  /**
   * Track user interaction (click, input, etc.)
   * @param {string} elementType - Type of element (button, link, input)
   * @param {string} elementId - Element identifier
   * @param {Object} metadata - Additional data
   */
  function trackInteraction(elementType, elementId, metadata = {}) {
    if (!enabled.value || !currentSession.value) return

    trackEvent('interaction', elementType, elementId, 1, metadata)
  }

  /**
   * Track search queries
   * @param {string} query - Search query
   * @param {number} resultsCount - Number of results
   * @param {string} category - Search category/context
   */
  function trackSearch(query, resultsCount, category = 'general') {
    if (!enabled.value || !currentSession.value) return

    trackEvent('search', 'query', category, resultsCount, { query })
  }

  /**
   * Track errors
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  function trackError(error, context = 'unknown') {
    if (!enabled.value || !currentSession.value) return

    trackEvent('error', 'exception', context, null, {
      message: error.message,
      stack: error.stack?.substring(0, 500), // Limit stack trace
      url: window.location.href,
    })
  }

  /**
   * Track performance metrics
   * @param {string} metric - Metric name (e.g., 'page_load', 'api_call')
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional data
   */
  function trackPerformance(metric, duration, metadata = {}) {
    if (!enabled.value || !currentSession.value) return

    trackEvent('performance', metric, null, duration, metadata)
  }

  /**
   * Set user information for current session
   * @param {number} userId - User ID
   * @param {string} userRole - User role
   */
  function setUser(userId, userRole) {
    if (!currentSession.value) return

    currentSession.value.userId = userId
    currentSession.value.userRole = userRole

    saveToLocalStorage()
  }

  /**
   * End current session
   */
  function endSession() {
    if (!currentSession.value) return

    currentSession.value.endedAt = new Date()
    currentSession.value.duration = currentSession.value.endedAt - currentSession.value.startedAt

    saveToLocalStorage()
    currentSession.value = null
  }

  /**
   * Get analytics summary
   * @returns {Object} Summary statistics
   */
  function getSummary() {
    const totalEvents = events.value.length
    const totalSessions = sessions.value.length

    // Count by category
    const eventsByCategory = {}
    events.value.forEach((event) => {
      if (event.category) {
        eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1
      }
    })

    // Count by action
    const eventsByAction = {}
    events.value.forEach((event) => {
      if (event.action) {
        eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1
      }
    })

    // Page views
    const pageViews = events.value.filter((e) => e.type === 'page_view')
    const uniquePages = new Set(pageViews.map((pv) => pv.path))

    // Average session duration
    const completedSessions = sessions.value.filter((s) => s.endedAt)
    const avgSessionDuration =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length
        : 0

    return {
      totalEvents,
      totalSessions,
      totalPageViews: pageViews.length,
      uniquePages: uniquePages.size,
      eventsByCategory,
      eventsByAction,
      averageSessionDuration: Math.round(avgSessionDuration),
      currentSessionActive: !!currentSession.value,
    }
  }

  /**
   * Get events by category
   * @param {string} category - Event category
   * @returns {Array} Filtered events
   */
  function getEventsByCategory(category) {
    return events.value.filter((e) => e.category === category)
  }

  /**
   * Get events by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Filtered events
   */
  function getEventsByDateRange(startDate, endDate) {
    return events.value.filter((e) => {
      const eventDate = new Date(e.timestamp)
      return eventDate >= startDate && eventDate <= endDate
    })
  }

  /**
   * Clear all analytics data
   */
  function clearAll() {
    events.value = []
    sessions.value = []
    currentSession.value = null
    localStorage.removeItem('alis_analytics')
  }

  /**
   * Export analytics data
   * @returns {Object} All analytics data
   */
  function exportData() {
    return {
      events: events.value,
      sessions: sessions.value,
      summary: getSummary(),
      exportedAt: new Date(),
    }
  }

  /**
   * Enable/disable analytics tracking
   * @param {boolean} value - Enable or disable
   */
  function setEnabled(value) {
    enabled.value = value
    saveToLocalStorage()
  }

  // --- Persistence ---

  function saveToLocalStorage() {
    try {
      const data = {
        events: events.value.slice(-1000), // Keep last 1000 events
        sessions: sessions.value.slice(-50), // Keep last 50 sessions
        currentSession: currentSession.value,
        enabled: enabled.value,
      }
      localStorage.setItem('alis_analytics', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save analytics:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('alis_analytics')
      if (data) {
        const parsed = JSON.parse(data)
        events.value = parsed.events || []
        sessions.value = parsed.sessions || []
        currentSession.value = parsed.currentSession
        enabled.value = parsed.enabled !== false
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Load saved data on initialization
  loadFromLocalStorage()

  return {
    events,
    sessions,
    currentSession,
    enabled,
    initSession,
    trackPageView,
    trackEvent,
    trackInteraction,
    trackSearch,
    trackError,
    trackPerformance,
    setUser,
    endSession,
    getSummary,
    getEventsByCategory,
    getEventsByDateRange,
    clearAll,
    exportData,
    setEnabled,
  }
})
