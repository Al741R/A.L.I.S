<template>
  <div class="reports-page">
    <div class="content-container">
      <div class="top-row">
        <h1 class="page-title">Weekly Reports</h1>
        <button class="close-btn" @click="goBack">Close</button>
      </div>
      <div class="toolbar">
        <div class="search-box">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="search"
            placeholder="Search report"
            name="report_search"
            id="report-search"
          />
        </div>
        <select v-model="filter" class="status-filter" name="report_filter" id="report-filter">
          <option value="">All</option>
          <option value="recent">Recent</option>
        </select>
        <label class="toggle-multi">
          <input
            type="checkbox"
            v-model="reports.allowMultiplePerWeek"
            @change="reports.saveSettings()"
          />
          <span>Allow multiple versions/week</span>
        </label>
        <button class="outline" @click="generate" :disabled="generating">
          {{ generating ? 'Generating…' : 'Generate Report' }}
        </button>
        <ExportButton
          v-if="filtered.length"
          :data="exportData"
          filename="reports-list"
          :formats="['csv', 'excel']"
          title="Reports List"
        />
      </div>
      <div class="list-wrapper" v-if="paged.length">
        <h2 class="section-title">Recent</h2>
        <div class="table-scroll">
          <table class="reports-table">
            <thead>
              <tr>
                <th style="color: #000000">Week</th>
                <th style="color: #000000">Size</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in paged" :key="r.id">
                <td class="week-col">
                  {{ formatWeek(r) }}
                  <span
                    v-if="weekCounts[weekKey(r)] > 1"
                    class="version-badge"
                    :title="new Date(r.generated_at).toLocaleString()"
                    >{{ timeOf(r) }}</span
                  >
                </td>
                <td style="color: #000000">{{ humanSize(r.size_bytes) }}</td>
                <td><button class="view-btn" @click="openDetail(r)">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pager">
          <button :disabled="page === 1" @click="page--">‹</button>
          <span
            v-for="p in totalPages"
            :key="p"
            :class="['p-num', { active: p === page }]"
            @click="page = p"
            >{{ p }}</span
          >
          <button :disabled="page === totalPages" @click="page++">›</button>
        </div>
      </div>
      <p v-else class="empty">No reports yet. Generate one to get started.</p>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReportsStore } from '@/stores/reports'
import ExportButton from '@/components/ui/ExportButton.vue'

const reports = useReportsStore()
const search = ref('')
const filter = ref('')
const generating = ref(false)
const page = ref(1)
const perPage = 7
const isLoading = ref(true)
const router = useRouter()

onMounted(() => {
  // Load local reports data
  reports.loadLocal?.()
  reports.loadSettings?.()
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})
// Expose store helper used in template
const { humanSize } = reports

function generate() {
  generating.value = true
  useReportsStore()
    .generateCurrentWeek()
    .finally(() => {
      generating.value = false
    })
}
function formatWeek(r) {
  const s = new Date(r.start)
  const e = new Date(r.end)
  const opt = { month: 'long', day: 'numeric' }
  return `${s.toLocaleDateString(undefined, opt)} - ${e.toLocaleDateString(undefined, opt)}, ${e.getFullYear()}`
}
function openDetail(r) {
  router.push({ name: 'report-detail', params: { id: r.id } })
}
function goBack() {
  router.push({ name: 'dashboard' })
}

function weekKey(r) {
  return `${r.start}_${r.end}`
}
const weekCounts = computed(() => {
  const map = {}
  for (const r of reports.list) {
    const k = weekKey(r)
    map[k] = (map[k] || 0) + 1
  }
  return map
})
function timeOf(r) {
  const d = new Date(r.generated_at)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const filtered = computed(() => {
  const term = search.value.toLowerCase().trim()
  return reports.list.filter((r) => {
    const w = formatWeek(r).toLowerCase()
    const matchesTerm = !term || w.includes(term)
    return matchesTerm
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

// Export data for CSV/Excel
const exportData = computed(() => {
  return filtered.value.map((report) => ({
    Week: formatWeek(report),
    'Generated At': new Date(report.generated_at).toLocaleString(),
    Size: humanSize(report.size_bytes),
    'Start Date': new Date(report.start).toLocaleDateString(),
    'End Date': new Date(report.end).toLocaleDateString(),
  }))
})
</script>
<style scoped>
.reports-page {
  padding: 32px 70px 60px 78px;
  font-family: Poppins, sans-serif;
  background: #8696fe;
  min-height: 1024px;
}
.content-container {
  background: var(--surface-2);
  border-radius: 12px;
  padding: 14px;
}
.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-strong);
}
.close-btn {
  background: var(--surface-1);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.close-btn:hover {
  background: var(--color-primary);
  color: #fff;
}
.toolbar {
  background: var(--surface-3);
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 18px;
}
.search-box {
  background: var(--surface-1);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  flex: 1;
}
.search-box input {
  border: none;
  outline: none;
  font-size: 14px;
  flex: 1;
}
.status-filter {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
}
.outline {
  background: var(--surface-1);
  border: 1px solid var(--color-secondary);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.outline:hover {
  background: var(--color-secondary);
  color: #fff;
}
.toggle-multi {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-strong);
  background: var(--surface-1);
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: 10px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 10px;
  color: var(--text-strong);
}
.reports-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface-1);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  font-size: 13px;
  min-width: 560px;
}
.reports-table th {
  text-align: left;
  background: #f8fafc;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.reports-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eef2f6;
}
.reports-table tbody tr:hover {
  background: #f5f9ff;
}
.week-col {
  font-weight: 500;
  color: var(--color-primary);
}
.version-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  font-size: 11px;
  line-height: 1;
  border-radius: 999px;
  background: #eef2ff;
  color: var(--color-primary);
  border: 1px solid #dde3ff;
}
.view-btn {
  background: var(--surface-1);
  border: 1px solid var(--color-primary);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  color: var(--color-primary);
}
.view-btn:hover {
  background: var(--color-primary);
  color: #fff;
}
.pager {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  margin-top: 12px;
}
.pager button,
.p-num {
  background: var(--surface-1);
  border: 1px solid var(--border);
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.p-num.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.empty {
  margin: 24px 0;
  font-size: 14px;
  color: var(--text-muted);
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
}

@media (max-width: 900px) {
  .reports-page {
    padding: 16px 16px 28px 16px;
    min-height: auto;
  }
  .toolbar {
    flex-wrap: wrap;
    gap: 10px;
  }
  .search-box {
    flex-basis: 100%;
  }
  .status-filter,
  .toggle-multi,
  .outline {
    flex: 0 0 auto;
  }
  .pager {
    justify-content: center;
  }
}
</style>
