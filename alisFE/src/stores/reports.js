import { defineStore } from 'pinia'
import { useBorrowingStore } from '@/stores/borrowing'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

// Local snapshot persistence key
const STORAGE_KEY = 'alis_reports_snapshots'
const SETTINGS_KEY = 'alis_reports_settings'

export const useReportsStore = defineStore('reports', () => {
  const list = ref([]) // snapshot metadata
  const current = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const allowMultiplePerWeek = ref(false)
  const { api, extract } = useApi()

  function loadLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(raw)) list.value = raw
    } catch {
      list.value = []
    }
  }
  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.value))
  }
  function loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
      if (raw && typeof raw === 'object') {
        allowMultiplePerWeek.value = !!raw.allowMultiplePerWeek
      }
    } catch {
      allowMultiplePerWeek.value = false
    }
  }
  function saveSettings() {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ allowMultiplePerWeek: allowMultiplePerWeek.value }),
    )
  }

  function weekBounds(date = new Date()) {
    const d = new Date(date)
    // Use Monday as start; report end Sunday (7 days)
    const day = d.getDay() // 0 Sun .. 6 Sat
    const diffToMonday = (day + 6) % 7 // number of days since Monday
    const start = new Date(d)
    start.setDate(d.getDate() - diffToMonday)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6) // Sunday (6 days after Monday)
    end.setHours(23, 59, 59, 999)
    return [start, end]
  }

  function formatDate(dt) {
    return `${dt.toLocaleString('default', { month: 'long' })} ${dt.getDate()}, ${dt.getFullYear()}`
  }
  function shortDate(dt) {
    return `${dt.getMonth() + 1}-${dt.getDate()}-${dt.getFullYear()}`
  }

  async function generateCurrentWeek() {
    loading.value = true
    error.value = null
    try {
      // Weekly summary only returns current relative week; we fetch granular blocks.
      const summary = extract(await api.get('/reports/weekly/summary'))
      const [start, end] = weekBounds()
      // Derive metrics (tolerant to varying backend key shapes)
      const borrowedValues = summary.borrowing?.values || []
      const returnedValues = summary.returns?.values || []
      const overdueValues = summary.overdues?.values || []
      const borrowedTotal = borrowedValues.reduce((a, b) => a + b, 0)
      const returnedTotal = returnedValues.reduce((a, b) => a + b, 0)
      // Prefer explicit total/count if provided
      const overdueTotal =
        summary.overdues?.total ??
        summary.overdues?.count ??
        overdueValues.reduce((a, b) => a + b, 0)

      // Dynamic detection of registration actions (any key containing 'REGISTER')
      const uaSeries = summary.userActivity?.series || {}
      let newMembers = 0
      Object.keys(uaSeries).forEach((k) => {
        if (k.toUpperCase().includes('REGISTER')) {
          newMembers += (uaSeries[k] || []).reduce((a, b) => a + b, 0)
        }
      })

      // Build daily table by iterating each day of the week to prevent missing / misaligned labels
      const borrowingLabels = summary.borrowing?.labels || []
      const returnLabels = summary.returns?.labels || []
      let daily = buildWeekDailyRows(
        start,
        end,
        borrowingLabels,
        returnLabels,
        borrowedValues,
        returnedValues,
      )
      // Fallback: if all borrowed & returned are zero, attempt client-side aggregation from transactions
      if (daily.every((r) => r.borrowed === 0 && r.returned === 0)) {
        try {
          const borrowingStore = useBorrowingStore()
          // Ensure transactions loaded (broad scope for admin/librarian)
          if (!borrowingStore.transactions.length) {
            await borrowingStore.fetchTransactions({ per_page: 500 })
          }
          daily = buildDailyFromTransactions(start, end, borrowingStore.transactions)
          if (daily.some((r) => r.borrowed > 0 || r.returned > 0)) {
            console.debug(
              '[Reports] Used client-side transaction aggregation fallback for daily data.',
            )
          }
        } catch (aggErr) {
          console.debug('[Reports] Fallback aggregation failed:', aggErr)
        }
      }
      const recommendations = buildRecommendations({
        borrowedTotal,
        returnedTotal,
        overdueTotal,
        newMembers,
      })
      const generated_at = new Date().toISOString()
      // Format dates in local timezone to avoid UTC conversion issues
      const formatLocalDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      const snapshot = {
        id: generated_at,
        start: formatLocalDate(start),
        end: formatLocalDate(end),
        generated_at,
        summary: {
          borrowed: borrowedTotal,
          returned: returnedTotal,
          overdue: overdueTotal,
          new_members: newMembers,
        },
        daily,
        recommendations,
        raw: summary,
        size_bytes: JSON.stringify(summary).length,
      }
      // Replace existing snapshot for same week only when versions are disabled
      if (!allowMultiplePerWeek.value) {
        list.value = list.value.filter(
          (r) => !(r.start === snapshot.start && r.end === snapshot.end),
        )
      }
      list.value.unshift(snapshot)
      saveLocal()
      current.value = snapshot
      return snapshot
    } catch (e) {
      error.value = e.response?.data || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  function normalizeDateLabel(raw) {
    if (!raw) return null
    // If already in YYYY-MM-DD format, return as-is (avoid timezone conversion)
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw
    }
    // Accept ISO, YYYY-MM-DD, MM/DD/YYYY
    let d = new Date(raw)
    if (isNaN(d.getTime())) {
      // Try splitting by common delimiters '/' or '-'
      const parts = raw.split(/[/-]/).map((p) => p.trim())
      if (parts.length === 3) {
        // Heuristic: if first part length ===4 treat as YYYY-MM-DD
        if (parts[0].length === 4) d = new Date(parts[0], Number(parts[1]) - 1, parts[2])
        else d = new Date(parts[2], Number(parts[0]) - 1, parts[1])
      }
    }
    if (isNaN(d.getTime())) return null
    // Use local date formatting to avoid timezone shift
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  function buildWeekDailyRows(
    start,
    end,
    borrowingLabels,
    returnLabels,
    borrowedVals,
    returnedVals,
  ) {
    const bLabels = Array.isArray(borrowingLabels) ? borrowingLabels : []
    const rLabels = Array.isArray(returnLabels) ? returnLabels : []
    const bMap = new Map()
    const rMap = new Map()
    bLabels.forEach((lbl, i) => {
      const key = normalizeDateLabel(lbl)
      if (key) bMap.set(key, (borrowedVals || [])[i] || 0)
    })
    rLabels.forEach((lbl, i) => {
      const key = normalizeDateLabel(lbl)
      if (key) rMap.set(key, (returnedVals || [])[i] || 0)
    })
    const rows = []
    const cursor = new Date(start)
    let dayIndex = 0
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
    const fallbackBorrow = bMap.size === 0
    const fallbackReturn = rMap.size === 0
    // Helper to format date in local timezone
    const toLocalDateString = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    while (cursor <= end) {
      const key = toLocalDateString(cursor)
      rows.push({
        label: key,
        borrowed: fallbackBorrow ? (borrowedVals[dayIndex] ?? 0) : (bMap.get(key) ?? 0),
        returned: fallbackReturn ? (returnedVals[dayIndex] ?? 0) : (rMap.get(key) ?? 0),
      })
      cursor.setDate(cursor.getDate() + 1)
      dayIndex++
    }
    // If arrays are longer than days, optionally aggregate overflow (not displayed)
    if (fallbackBorrow && borrowedVals.length > totalDays) {
      const extra = borrowedVals.slice(totalDays).reduce((a, b) => a + b, 0)
      if (extra) console.debug('[Reports] Borrowed values had overflow (ignored days):', extra)
    }
    if (fallbackReturn && returnedVals.length > totalDays) {
      const extra = returnedVals.slice(totalDays).reduce((a, b) => a + b, 0)
      if (extra) console.debug('[Reports] Returned values had overflow (ignored days):', extra)
    }
    if (fallbackBorrow && bLabels.length && bMap.size === 0) {
      console.debug('[Reports] Borrowing labels not parseable; used index fallback.', bLabels)
    }
    if (fallbackReturn && rLabels.length && rMap.size === 0) {
      console.debug('[Reports] Return labels not parseable; used index fallback.', rLabels)
    }
    return rows
  }
  function buildDailyFromTransactions(start, end, transactions) {
    const rows = []
    const cursor = new Date(start)
    const list = Array.isArray(transactions) ? transactions : []
    // Helper to format date in local timezone
    const toLocalDateString = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    while (cursor <= end) {
      const key = toLocalDateString(cursor)
      const borrowedCount = list.filter((t) => {
        if (!t.date_borrowed) return false
        const db = new Date(t.date_borrowed)
        return !isNaN(db.getTime()) && toLocalDateString(db) === key
      }).length
      const returnedCount = list.filter((t) => {
        const dr = t.date_returned || t.returned_at || t.dateReturned
        if (!dr) return false
        const d = new Date(dr)
        return !isNaN(d.getTime()) && toLocalDateString(d) === key
      }).length
      rows.push({ label: key, borrowed: borrowedCount, returned: returnedCount })
      cursor.setDate(cursor.getDate() + 1)
    }
    return rows
  }
  function buildRecommendations({ borrowedTotal, returnedTotal, overdueTotal, newMembers }) {
    const rec = []
    if (overdueTotal > returnedTotal * 0.3) rec.push('Improve due date reminders and follow-ups.')
    if (borrowedTotal > returnedTotal * 1.5)
      rec.push('Consider acquiring more copies of high-demand books.')
    if (newMembers === 0) rec.push('Promote membership registrations to grow user base.')
    if (rec.length === 0) rec.push('System performance and usage metrics are within normal range.')
    return rec
  }

  function find(id) {
    return list.value.find((r) => r.id === id)
  }
  function setCurrent(id) {
    current.value = find(id) || null
  }

  function humanSize(bytes) {
    if (!bytes) return '0 B'
    const mb = bytes / (1024 * 1024)
    return mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
  }

  loadLocal()
  loadSettings()

  return {
    list,
    current,
    loading,
    error,
    allowMultiplePerWeek,
    saveSettings,
    generateCurrentWeek,
    setCurrent,
    find,
    humanSize,
    weekBounds,
    shortDate,
    formatDate,
  }
})
