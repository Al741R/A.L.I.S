import { defineStore } from 'pinia'
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
    // Use Monday as start; report end Saturday (like screenshot) -> compute
    const day = d.getDay() // 0 Sun .. 6 Sat
    const diffToMonday = (day + 6) % 7 // number of days since Monday
    const start = new Date(d)
    start.setDate(d.getDate() - diffToMonday)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 5) // Saturday
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

      // Build daily table using union of borrowing & returns labels to avoid misalignment
      const borrowingLabels = summary.borrowing?.labels || []
      const returnLabels = summary.returns?.labels || []
      const daily = buildDailyRows(borrowingLabels, returnLabels, borrowedValues, returnedValues)
      const recommendations = buildRecommendations({
        borrowedTotal,
        returnedTotal,
        overdueTotal,
        newMembers,
      })
      const generated_at = new Date().toISOString()
      const snapshot = {
        id: generated_at,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
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

  function buildDailyRows(borrowingLabels, returnLabels, borrowedVals, returnedVals) {
    const bLabels = Array.isArray(borrowingLabels) ? borrowingLabels : []
    const rLabels = Array.isArray(returnLabels) ? returnLabels : []
    const all = Array.from(new Set([...bLabels, ...rLabels]))
    // Attempt chronological sort if labels parse as dates; else keep existing order
    const allSorted = all.slice().sort((a, b) => {
      const da = Date.parse(a)
      const db = Date.parse(b)
      if (!isNaN(da) && !isNaN(db)) return da - db
      return all.indexOf(a) - all.indexOf(b)
    })
    const rows = []
    allSorted.forEach((label) => {
      const bIndex = bLabels.indexOf(label)
      const rIndex = rLabels.indexOf(label)
      rows.push({
        label,
        borrowed: bIndex >= 0 ? (borrowedVals || [])[bIndex] || 0 : 0,
        returned: rIndex >= 0 ? (returnedVals || [])[rIndex] || 0 : 0,
      })
    })
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
