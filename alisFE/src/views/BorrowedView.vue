<template>
  <div class="borrowed-admin">
    <div class="content-container">
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
            placeholder="Search book or borrower"
            name="borrowed_search"
            id="borrowed-search"
            autocomplete="off"
          />
        </div>
        <select
          v-model="statusFilter"
          class="status-filter"
          name="borrowed_status"
          id="borrowed-status"
        >
          <option value="">All</option>
          <option value="Borrowed">Borrowed</option>
          <option value="Overdue">Overdue</option>
        </select>
        <select
          v-model="borrowerFilter"
          class="status-filter"
          name="borrower_filter"
          id="borrower-filter"
        >
          <option value="">All Borrowers</option>
          <option v-for="b in borrowerOptions" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
        <select
          v-model="categoryFilter"
          class="status-filter"
          v-if="categoryOptions.length"
          name="category_filter"
          id="category-filter"
        >
          <option value="">All Categories</option>
          <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <button class="outline" type="button" @click="exportCsv">Export CSV</button>
        <button class="outline" type="button" @click="toggleRequests">Requests</button>
        <button class="close-page" type="button" @click="goDashboard" aria-label="Close Page">
          ×
        </button>
      </div>

      <div class="table-wrapper" v-if="paged.length">
        <table class="borrowed-table">
          <thead>
            <tr>
              <th @click="setSort('title')">
                Title <span class="sort">{{ sortLabel('title') }}</span>
              </th>
              <th @click="setSort('borrower')">
                Borrower <span class="sort">{{ sortLabel('borrower') }}</span>
              </th>
              <th @click="setSort('date_borrowed')">
                Borrowed <span class="sort">{{ sortLabel('date_borrowed') }}</span>
              </th>
              <th @click="setSort('due_date')">
                Due <span class="sort">{{ sortLabel('due_date') }}</span>
              </th>
              <th @click="setSort('days_overdue')">
                Days Overdue <span class="sort">{{ sortLabel('days_overdue') }}</span>
              </th>
              <th @click="setSort('fine')">
                Fine <span class="sort">{{ sortLabel('fine') }}</span>
              </th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in paged" :key="t.id">
              <td>{{ t.book?.title || '—' }}</td>
              <td>{{ borrowerName(t) }}</td>
              <td>{{ formatDate(t.date_borrowed) }}</td>
              <td :class="{ overdue: isOverdue(t) }">{{ formatDate(t.due_date) }}</td>
              <td :class="{ overdue: t._daysOverdue > 0 }">{{ t._daysOverdue }}</td>
              <td :class="['fine-cell', { overdue: t._daysOverdue > 0 }]">
                {{ currency(t._fine) }}
              </td>
              <td>
                <span class="status-pill" :class="statusKey(t)">{{ statusLabel(t) }}</span>
              </td>
              <td>
                <button
                  v-if="canReturn(t)"
                  class="icon-btn"
                  @click="confirmReturn(t)"
                  :disabled="returningId === t.id"
                >
                  {{ returningId === t.id ? 'Returning…' : 'Confirm Return' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="table-footer">
          <span>Showing {{ paged.length }} of {{ filtered.length }}</span>
          <div class="pager">
            <button :disabled="page === 1" @click="page--">‹</button>
            <span
              class="p-num"
              v-for="p in totalPages"
              :key="p"
              :class="{ active: p === page }"
              @click="page = p"
              >{{ p }}</span
            >
            <button :disabled="page === totalPages" @click="page++">›</button>
          </div>
        </div>
      </div>
      <p v-else class="empty">No active borrowed books.</p>
    </div>

    <!-- Requests Modal -->
    <div v-if="showRequests" class="modal-overlay" @click.self="toggleRequests">
      <div class="modal">
        <button class="close" @click="toggleRequests" aria-label="Close">×</button>
        <div class="modal-header-line">
          <h2 class="modal-title">Requests Center</h2>
          <button
            type="button"
            class="outline refresh-req"
            @click="refreshRequests"
            :disabled="refreshing"
          >
            {{ refreshing ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
        <h3 class="req-section-title">Borrow Requests</h3>
        <ul class="req-list" v-if="borrowRequestsList.length">
          <li
            v-for="r in borrowRequestsList"
            :key="r.id"
            class="borrow-req-entry"
            :class="r.status.toLowerCase()"
          >
            <div class="req-entry">
              <strong class="req-title">{{ r.book?.title || '—' }}</strong>
              <div class="req-meta-line">
                <span>Borrower: {{ borrowerNameFromUser(r.borrower) }}</span>
                <span>| Requested: {{ formatDate(r.created_at) }}</span>
                <span>| Status: {{ r.status }}</span>
              </div>
              <div class="req-actions" v-if="r.status === 'Pending'">
                <button
                  class="outline"
                  @click="approveBorrowRequest(r)"
                  :disabled="approvingBorrowId === r.id"
                >
                  {{ approvingBorrowId === r.id ? 'Approving…' : 'Approve' }}
                </button>
                <button
                  class="outline"
                  @click="denyBorrowRequest(r)"
                  :disabled="denyingBorrowId === r.id"
                >
                  {{ denyingBorrowId === r.id ? 'Denying…' : 'Deny' }}
                </button>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="empty small">No pending borrow requests.</p>
        <h3 class="req-section-title">Return Requests</h3>
        <ul class="req-list" v-if="requestTx.length">
          <li v-for="t in requestTx" :key="t.id" :class="statusKey(t)">
            <div class="req-entry">
              <strong class="req-title">{{ t.book?.title || '—' }}</strong>
              <div class="req-meta-line">
                <span>Borrower: {{ borrowerName(t) }}</span>
                <span>| Borrowed: {{ formatDate(t.date_borrowed) }}</span>
                <span>| Due: {{ formatDate(t.due_date) }}</span>
                <span>| Status: {{ statusLabel(t) }}</span>
              </div>
              <div class="req-actions">
                <button class="outline" @click="confirmReturn(t)" :disabled="returningId === t.id">
                  {{ returningId === t.id ? 'Processing…' : 'Confirm' }}
                </button>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="empty small">No pending return requests.</p>
        <h3 class="req-section-title">Account Creation Requests</h3>
        <ul class="req-list" v-if="accountRequests.length">
          <li v-for="r in accountRequests" :key="r.id" class="acct-entry">
            <div class="req-entry">
              <strong class="req-title">{{ r.name }}</strong>
              <div class="req-meta-line">
                <span>Email: {{ r.email }}</span>
                <span>| Requested: {{ formatDate(r.requested_at) }}</span>
              </div>
              <div class="req-actions">
                <button class="outline" @click="approveAccount(r)" :disabled="approvingId === r.id">
                  {{ approvingId === r.id ? 'Approving…' : 'Approve' }}
                </button>
                <button class="outline" @click="rejectAccount(r)" :disabled="approvingId === r.id">
                  Reject
                </button>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="empty small">No pending account requests.</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBorrowingStore } from '@/stores/borrowing'
import { useBorrowRequestsStore } from '@/stores/borrowRequests'
import { useNotificationsStore } from '@/stores/notifications'
import { useBooksStore } from '@/stores/books'
import { useUsersStore } from '@/stores/users'
import { isOverdue, effectiveStatus } from '@/composables/borrowStatus'
// Removed AdminLoader to simplify admin UI; keep inline skeletons if needed

const DAILY_FINE = 10.0

const router = useRouter()
const borrowing = useBorrowingStore()
const borrowRequestsStore = useBorrowRequestsStore()
const approvingBorrowId = ref(null)
const isLoading = ref(true)
const denyingBorrowId = ref(null)
const notify = useNotificationsStore()
const books = useBooksStore()
const users = useUsersStore()

function goDashboard() {
  router.push({ name: 'dashboard' })
}

const search = ref('')
const statusFilter = ref('')
const borrowerFilter = ref('')
const categoryFilter = ref('')
const page = ref(1)
const perPage = 25
const sortBy = ref('')
const sortDir = ref('asc')
const returningId = ref(null)
const showRequests = ref(false)
// Placeholder account creation requests (to be replaced by API later)
const accountRequests = ref([
  // Example pending request objects
  // { id: 1, name: 'Pending User', email: 'pending@example.com', requested_at: new Date().toISOString() }
])
const approvingId = ref(null)
const refreshing = ref(false)

function toggleRequests() {
  showRequests.value = !showRequests.value
}
async function refreshRequests() {
  refreshing.value = true
  try {
    await Promise.all([borrowRequestsStore.fetchAll?.(), borrowing.fetchTransactions()])
    notify.push('Requests refreshed.', { type: 'success' })
  } catch (e) {
    console.error(e)
    notify.push('Failed to refresh.', { type: 'error' })
  } finally {
    refreshing.value = false
  }
}

function borrowerName(t) {
  const u = t.borrower || t.user || users.list.find((x) => x.id === t.user_id)
  if (!u) return '—'
  return u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || '—'
}
function borrowerNameFromUser(u) {
  if (!u) return '—'
  return u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || '—'
}
function formatDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`
}
function statusLabel(t) {
  const s = effectiveStatus(t)
  switch (s) {
    case 'Borrowed':
      return 'Borrowed'
    case 'Overdue':
      return 'Overdue'
    case 'ReturnRequested':
      return 'Return Requested'
    case 'Returned':
      return 'Returned'
    case 'Lost':
      return 'Lost'
    default:
      return s || 'Unknown'
  }
}
function statusKey(t) {
  return String(effectiveStatus(t) || '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
function currency(v) {
  return typeof v === 'number' ? v.toFixed(2) : '0.00'
}
function canReturn(t) {
  return ['Borrowed', 'Overdue', 'ReturnRequested'].includes(effectiveStatus(t))
}

// Derived decorated transactions
const decorated = computed(() => {
  return borrowing.transactions.map((t) => {
    let days = 0
    if (t.due_date && ['Borrowed', 'Overdue', 'ReturnRequested'].includes(t.status)) {
      const due = new Date(t.due_date)
      const now = new Date()
      if (now > due) {
        days = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)))
      }
    }
    const fine = days * DAILY_FINE
    return { ...t, _daysOverdue: days, _fine: fine }
  })
})

// Treat items past their due date as Overdue even if backend hasn't flipped status yet.
// effectiveStatus now imported

const active = computed(() =>
  decorated.value.filter((t) => {
    const s = effectiveStatus(t)
    // Keep anything not returned yet (Borrowed, Overdue, ReturnRequested) in main list so overdue doesn't flash then vanish.
    return ['Borrowed', 'Overdue'].includes(s)
  }),
)
const requestTx = computed(() => decorated.value.filter((t) => t.status === 'ReturnRequested'))
// Show only pending borrow requests so approved/denied items disappear.
const borrowRequestsList = computed(() => borrowRequestsStore.pending)

const borrowerOptions = computed(() => {
  return users.list
    .filter((u) => u.role_name === 'Borrower')
    .map((u) => ({
      id: u.id,
      name: u.full_name || u.name || [u.first_name, u.last_name].filter(Boolean).join(' '),
    }))
})
const categoryOptions = computed(() => {
  const set = new Set(
    books.list
      .map(
        (b) =>
          b.subject ||
          b.category_name ||
          (b.category && b.category.name) ||
          (typeof b.category === 'string' ? b.category : '') ||
          '',
      )
      .filter(Boolean),
  )
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return active.value.filter((t) => {
    const title = (t.book?.title || '').toLowerCase()
    const bname = borrowerName(t).toLowerCase()
    const categorySource =
      t.book?.subject ||
      t.book?.category_name ||
      (t.book?.category && t.book?.category.name) ||
      (typeof t.book?.category === 'string' ? t.book?.category : '') ||
      ''
    const category = String(categorySource).toLowerCase()
    const matchesTerm = !term || title.includes(term) || bname.includes(term)
    const effStatus = effectiveStatus(t)
    const matchesStatus =
      !statusFilter.value ||
      (statusFilter.value === 'Overdue'
        ? effStatus === 'Overdue'
        : effStatus === statusFilter.value)
    const matchesBorrower = !borrowerFilter.value || t.user_id === borrowerFilter.value
    const matchesCategory =
      !categoryFilter.value || category === String(categoryFilter.value).toLowerCase()
    return matchesTerm && matchesStatus && matchesBorrower && matchesCategory
  })
})

const sorted = computed(() => {
  const arr = filtered.value.slice()
  if (!sortBy.value) return arr
  const dir = sortDir.value === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    let va = ''
    let vb = ''
    switch (sortBy.value) {
      case 'title':
        va = a.book?.title || ''
        vb = b.book?.title || ''
        break
      case 'borrower':
        va = borrowerName(a)
        vb = borrowerName(b)
        break
      case 'date_borrowed':
        va = a.date_borrowed || ''
        vb = b.date_borrowed || ''
        break
      case 'due_date':
        va = a.due_date || ''
        vb = b.due_date || ''
        break
      case 'days_overdue':
        return (a._daysOverdue - b._daysOverdue) * dir
      case 'fine':
        return (a._fine - b._fine) * dir
      default:
        va = ''
        vb = ''
    }
    return va.toString().localeCompare(vb.toString()) * dir
  })
  return arr
})

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / perPage)))
const paged = computed(() => {
  const start = (page.value - 1) * perPage
  return sorted.value.slice(start, start + perPage)
})
watch(sorted, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

function setSort(key) {
  if (sortBy.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    sortBy.value = key
    sortDir.value = 'asc'
  }
}
function sortLabel(key) {
  return sortBy.value === key ? (sortDir.value === 'asc' ? '▲' : '▼') : ''
}

async function confirmReturn(t) {
  returningId.value = t.id
  try {
    await borrowing.returnBook(t.id)
    notify.push('Return processed.', { type: 'success' })
    borrowing.fetchTransactions()
  } catch (err) {
    notify.push('Return failed.', { type: 'error' })
    console.error(err)
  } finally {
    returningId.value = null
  }
}

function exportCsv() {
  const headers = [
    'TransactionID',
    'BookTitle',
    'Borrower',
    'DateBorrowed',
    'DueDate',
    'DaysOverdue',
    'Fine',
    'Status',
  ]
  const rows = filtered.value.map((t) => [
    t.id,
    (t.book?.title || '').replace(/,/g, ';'),
    borrowerName(t).replace(/,/g, ';'),
    formatDate(t.date_borrowed),
    formatDate(t.due_date),
    t._daysOverdue,
    currency(t._fine),
    statusLabel(t),
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `borrowed_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  notify.push('CSV exported.', { type: 'success' })
}

onMounted(async () => {
  try {
    // Load active transactions using backend overdue logic + borrowed status.
    await Promise.all([
      borrowing.fetchActiveTransactions?.() ||
        borrowing.fetchAllTransactions?.() ||
        borrowing.fetchTransactions(),
      books.fetchAll(),
      users.fetchAll(),
      borrowRequestsStore.fetchAll?.(),
    ])
  } catch (error) {
    console.error('Error loading borrowed data:', error)
  } finally {
    // Restore sort state
    const sb = localStorage.getItem('borrowed_sort_by')
    const sd = localStorage.getItem('borrowed_sort_dir')
    if (sb) sortBy.value = sb
    if (sd) sortDir.value = sd
    setTimeout(() => {
      isLoading.value = false
    }, 500)
  }
})

// Debug: log counts as data arrives to trace disappearance.
watch(
  () => borrowing.transactions,
  (val) => {
    console.debug('[BorrowedView] transactions loaded:', Array.isArray(val) ? val.length : 'n/a')
    const overdue = val.filter((t) => isOverdue(t)).length
    console.debug('[BorrowedView] overdue detected client-side:', overdue)
  },
  { immediate: true },
)

watch([sortBy, sortDir], ([sb, sd]) => {
  if (sb) localStorage.setItem('borrowed_sort_by', sb)
  if (sd) localStorage.setItem('borrowed_sort_dir', sd)
})

function approveAccount(r) {
  approvingId.value = r.id
  // Simulate approval; replace with real API call when available
  setTimeout(() => {
    accountRequests.value = accountRequests.value.filter((x) => x.id !== r.id)
    approvingId.value = null
    notify.push('Account approved.', { type: 'success' })
  }, 600)
}
async function approveBorrowRequest(r) {
  approvingBorrowId.value = r.id
  try {
    await borrowRequestsStore.approve(r.id)
    // Refresh transactions to include newly created borrow
    borrowing.fetchTransactions()
  } catch (e) {
    console.error(e)
  } finally {
    approvingBorrowId.value = null
  }
}
async function denyBorrowRequest(r) {
  denyingBorrowId.value = r.id
  try {
    await borrowRequestsStore.deny(r.id)
  } catch (e) {
    console.error(e)
  } finally {
    denyingBorrowId.value = null
  }
}
function rejectAccount(r) {
  approvingId.value = r.id
  setTimeout(() => {
    accountRequests.value = accountRequests.value.filter((x) => x.id !== r.id)
    approvingId.value = null
    notify.push('Account request rejected.', { type: 'info' })
  }, 600)
}
</script>
<style scoped>
.borrowed-admin {
  padding: 32px 48px 62px 78px;
  font-family: Poppins, sans-serif;
  background: #8696fe;
  min-height: 1024px;
  box-sizing: border-box;
}
.content-container {
  max-width: 1200px;
  margin: 40px auto 0;
  width: 100%;
  background: #e2f0fce7;
  border-radius: 20px;
  padding: 32px 36px 46px;
  box-shadow:
    0 8px 28px -6px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}
.toolbar {
  background: #eef3ff;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.search-box {
  background: #fff;
  border: 1px solid #d1d9e6;
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
  background: #fff;
  border: 1px solid #d1d9e6;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
}
.close-page {
  background: #fff;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  font-size: 18px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.close-page:hover {
  background: #f1f5f9;
}
.table-wrapper {
  margin-top: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.borrowed-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #111827;
}
.borrowed-table th {
  text-align: left;
  background: #f8fafc;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.borrowed-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eef2f6;
}
.borrowed-table tbody tr:hover {
  background: #f5f9ff;
}
.overdue {
  color: #dc2626;
  font-weight: 600;
}
.fine-cell.overdue {
  background: #fee2e2;
  color: #991b1b;
  font-weight: 600;
  border-radius: 6px;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #64748b;
}
.status-pill.borrowed::before {
  background: #15803d;
}
.status-pill.overdue::before {
  background: #dc2626;
}
.status-pill.return-requested::before {
  background: #f59e0b;
}
.status-pill.returned::before {
  background: #64748b;
}
.icon-btn {
  background: #fff;
  border: 1px solid #cbd5e1;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.icon-btn:hover {
  background: #f1f5f9;
}
.sort {
  font-size: 12px;
  color: #64748b;
  margin-left: 6px;
}
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 12px;
  background: #f8fafc;
  color: #000000;
}
.pager {
  display: flex;
  gap: 4px;
}
.pager button,
.p-num {
  background: #fff;
  border: 1px solid #d1d9e6;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.p-num.active {
  background: #063fd1;
  color: #fff;
  border-color: #063fd1;
}
.empty {
  margin-top: 32px;
  font-size: 14px;
  color: #64748b;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 30px;
  z-index: 4000;
}
.modal {
  background: #fff;
  width: 100%;
  max-width: 860px;
  border-radius: 16px;
  padding: 36px 40px 30px;
  box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.35);
  position: relative;
}
.close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 28px;
  cursor: pointer;
}
.modal-title {
  margin: 0 0 20px;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
}
.modal-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.refresh-req {
  margin-left: auto;
}
.req-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
}
.req-list li {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 12px;
}
.req-section-title {
  margin: 32px 0 10px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.req-section-title:first-of-type {
  margin-top: 0;
}
.req-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.req-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
.req-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #475569;
}
.req-actions {
  display: flex;
  justify-content: flex-end;
}
.outline {
  background: #fff;
  border: 1px solid #374151;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.outline:hover {
  background: #374151;
  color: #fff;
}
@media (max-width: 900px) {
  .borrowed-admin {
    padding: 24px 20px 60px 20px;
  }
  .content-container {
    padding: 24px 24px 40px;
  }
  .toolbar {
    flex-wrap: wrap;
  }
}
</style>
