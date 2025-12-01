<template>
  <div class="borrowers-admin">
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
          <input v-model="search" placeholder="Search name or ID" />
        </div>
        <select v-model="statusFilter" class="status-filter">
          <option value="">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button class="close-page" type="button" @click="goDashboard" aria-label="Close Page">
          ×
        </button>
      </div>

      <div class="table-wrapper" v-if="paged.length">
        <table class="borrowers-table">
          <thead>
            <tr>
              <th @click="setSort('sid')">
                SID/FID <span class="sort">{{ sortLabel('sid') }}</span>
              </th>
              <th @click="setSort('name')">
                Name <span class="sort">{{ sortLabel('name') }}</span>
              </th>
              <th @click="setSort('email')">
                Email <span class="sort">{{ sortLabel('email') }}</span>
              </th>
              <th @click="setSort('role')">
                Role <span class="sort">{{ sortLabel('role') }}</span>
              </th>
              <th @click="setSort('status')">
                Status <span class="sort">{{ sortLabel('status') }}</span>
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in paged" :key="u.id">
              <td>{{ deriveSid(u) || '—' }}</td>
              <td>{{ u.full_name || u.name || '—' }}</td>
              <td>{{ u.email || '—' }}</td>
              <td>{{ u.role_name || '—' }}</td>
              <td>
                <span
                  class="status-pill"
                  :class="borrowerStatus(u) === 'Active' ? 'active' : 'inactive'"
                >
                  {{ borrowerStatus(u) }}
                </span>
              </td>
              <td class="action-cell">
                <button class="icon-btn" @click="openRecord(u)" title="View Record">
                  View Record
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="table-footer">
          <span>Showing {{ paged.length }} out of {{ filtered.length }}</span>
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
      <p v-else class="empty">No borrowers found.</p>
    </div>

    <!-- Record Modal -->
    <div v-if="showRecord" class="modal-overlay" @click.self="closeRecord">
      <div class="modal">
        <button class="close" @click="closeRecord" aria-label="Close">×</button>
        <h2 class="modal-title">{{ activeBorrower?.full_name || 'Borrower' }} Record</h2>
        <div class="record-body" v-if="activeBorrower">
          <section class="recent-section" v-if="recentTx">
            <h3 class="sec-title">Recent</h3>
            <div class="recent-box">
              <div class="book-line">
                <strong>{{ recentTx.book?.title || '—' }}</strong>
                <span class="meta">Due date: {{ formatDate(recentTx.due_date) }}</span>
                <span class="meta">Status: {{ statusLabel(recentTx) }}</span>
              </div>
              <div class="actions-row">
                <button
                  v-if="canReturnDirect(recentTx)"
                  class="outline"
                  @click="returnNow(recentTx)"
                  :disabled="returning"
                >
                  Return
                </button>
                <button
                  v-if="canRequestReturn(recentTx)"
                  class="outline"
                  @click="requestReturn(recentTx)"
                  :disabled="returning"
                >
                  Request Return
                </button>
              </div>
            </div>
          </section>
          <br />
          <h3 class="sec-title">History</h3>
          <section class="history-section">
            <ul class="history-list" v-if="history.length">
              <li v-for="t in history" :key="t.id" :class="statusKey(t)">
                <div class="hist-entry">
                  <strong class="hist-title">{{ t.book?.title || '—' }}</strong>
                  <div class="hist-meta-line">
                    <span>Borrowed: {{ formatDate(t.date_borrowed) }}</span>
                    <span>| Due: {{ formatDate(t.due_date) }}</span>
                    <span v-if="t.date_returned"
                      >| Returned: {{ formatDate(t.date_returned) }}</span
                    >
                    <span>| Status: {{ statusLabel(t) }}</span>
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="empty small">No history.</p>
          </section>
          <div class="issue-box">
            <button class="issue-btn" @click="openIssue">Issue New Book</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Issue Book Modal -->
    <div v-if="showIssue" class="modal-overlay" @click.self="closeIssue">
      <div class="modal small">
        <button class="close" @click="closeIssue" aria-label="Close">×</button>
        <h2 class="modal-title">Issue Book</h2>
        <form @submit.prevent="issueBook" class="issue-form">
          <label class="f-row">
            <span>Book</span>
            <select v-model="issue.book_id" required>
              <option value="">Select Book</option>
              <option v-for="b in availableBooks" :key="b.id" :value="b.id">{{ b.title }}</option>
            </select>
          </label>
          <label class="f-row">
            <span>Date Borrowed</span>
            <input type="date" v-model="issue.date_borrowed" required />
          </label>
          <label class="f-row">
            <span>Due Date</span>
            <input type="date" v-model="issue.due_date" required />
          </label>
          <div class="actions">
            <button type="button" class="outline" @click="closeIssue">Cancel</button>
            <button type="submit" class="save-btn" :disabled="issuing">
              {{ issuing ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useBorrowingStore } from '@/stores/borrowing'
import { useBooksStore } from '@/stores/books'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
// Removed AdminLoader to simplify admin UI; keep inline skeletons if needed

const router = useRouter()
const users = useUsersStore()
const borrowing = useBorrowingStore()
const books = useBooksStore()
const isLoading = ref(true)
const notify = useNotificationsStore()
const auth = useAuthStore()

function goDashboard() {
  router.push({ name: 'dashboard' })
}

const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const perPage = 25
const sortBy = ref('')
const sortDir = ref('asc')

// Record modal state
const showRecord = ref(false)
const activeBorrower = ref(null)
const returning = ref(false)

// Issue modal state
const showIssue = ref(false)
const issuing = ref(false)
const issue = ref({ book_id: '', date_borrowed: today(), due_date: todayPlusDays(7) })

function today() {
  return new Date().toISOString().split('T')[0]
}
function todayPlusDays(d) {
  const dt = new Date()
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().split('T')[0]
}

function deriveSid(u) {
  return u.student_number || u.faculty_number || u.sid || ''
}

function borrowerStatus(u) {
  const active = borrowing.transactions.some(
    (t) => t.user_id === u.id && ['Borrowed', 'Overdue', 'ReturnRequested'].includes(t.status),
  )
  return active ? 'Active' : 'Inactive'
}

const borrowers = computed(() => users.list.filter((u) => u.role_name === 'Borrower'))

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return borrowers.value.filter((u) => {
    const sid = deriveSid(u).toLowerCase()
    const name = (u.full_name || u.name || '').toLowerCase()
    const status = borrowerStatus(u)
    const matchesTerm = !term || sid.includes(term) || name.includes(term)
    const matchesStatus = !statusFilter.value || status === statusFilter.value
    return matchesTerm && matchesStatus
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
      case 'sid':
        va = deriveSid(a)
        vb = deriveSid(b)
        break
      case 'name':
        va = a.full_name || a.name || ''
        vb = b.full_name || b.name || ''
        break
      case 'email':
        va = a.email || ''
        vb = b.email || ''
        break
      case 'role':
        va = a.role_name || ''
        vb = b.role_name || ''
        break
      case 'status':
        va = borrowerStatus(a)
        vb = borrowerStatus(b)
        break
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
  if (sortBy.value !== key) return ''
  return sortDir.value === 'asc' ? '▲' : '▼'
}

// Record details computed
const history = computed(() => {
  if (!activeBorrower.value) return []
  return borrowing.transactions
    .filter((t) => t.user_id === activeBorrower.value.id)
    .sort((a, b) => new Date(b.date_borrowed) - new Date(a.date_borrowed))
})
const recentTx = computed(() =>
  history.value.find((t) => ['Borrowed', 'Overdue', 'ReturnRequested'].includes(t.status)),
)

function openRecord(u) {
  activeBorrower.value = u
  showRecord.value = true
}
function closeRecord() {
  showRecord.value = false
  activeBorrower.value = null
}

function openIssue() {
  issue.value = { book_id: '', date_borrowed: today(), due_date: todayPlusDays(7) }
  showIssue.value = true
}
function closeIssue() {
  showIssue.value = false
}

const availableBooks = computed(() => books.list.filter((b) => (b.available_copies || 0) > 0))

async function issueBook() {
  if (!activeBorrower.value) return
  issuing.value = true
  try {
    await borrowing.createBorrow({
      user_id: activeBorrower.value.id,
      book_id: issue.value.book_id,
      date_borrowed: issue.value.date_borrowed,
      due_date: issue.value.due_date,
    })
    notify.push('Book issued.', { type: 'success' })
    showIssue.value = false
    borrowing.fetchTransactions()
  } catch (err) {
    notify.push('Issue failed.', { type: 'error' })
    console.error(err)
  } finally {
    issuing.value = false
  }
}

function statusKey(t) {
  return String(t.status || '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
function statusLabel(t) {
  switch (t.status) {
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
      return t.status || 'Unknown'
  }
}
function formatDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return '—'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}-${dd}-${yyyy}`
}
function canRequestReturn(t) {
  return auth.role === 'Borrower' && ['Borrowed', 'Overdue'].includes(t.status)
}
function canReturnDirect(t) {
  return auth.role !== 'Borrower' && ['Borrowed', 'Overdue', 'ReturnRequested'].includes(t.status)
}
async function requestReturn(t) {
  returning.value = true
  try {
    await borrowing.requestReturn(t.id)
    notify.push('Return requested.', { type: 'success' })
  } catch (err) {
    notify.push('Request failed.', { type: 'error' })
    console.error(err)
  } finally {
    returning.value = false
    borrowing.fetchTransactions()
  }
}
async function returnNow(t) {
  returning.value = true
  try {
    await borrowing.returnBook(t.id)
    notify.push('Book returned.', { type: 'success' })
  } catch (err) {
    notify.push('Return failed.', { type: 'error' })
    console.error(err)
  } finally {
    returning.value = false
    borrowing.fetchTransactions()
  }
}

onMounted(async () => {
  try {
    await Promise.all([users.fetchAll(), borrowing.fetchTransactions(), books.fetchAll()])
  } catch (error) {
    console.error('Error loading borrowers data:', error)
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 500)
  }
})
</script>
<style scoped>
.borrowers-admin {
  padding: 32px 48px 62px 78px;
  font-family: Poppins, sans-serif;
  background: #8696fe;
  min-height: 1024px;
  box-sizing: border-box;
}
.content-container {
  max-width: 1200px;
  margin: 40px auto 0 auto;
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
.borrowers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #111827;
}
.borrowers-table th {
  text-align: left;
  background: #f8fafc;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.borrowers-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eef2f6;
}
.borrowers-table tbody tr:hover {
  background: #f5f9ff;
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
.status-pill.active::before {
  background: #15803d;
}
.status-pill.inactive::before {
  background: #64748b;
}
.action-cell {
  display: flex;
  gap: 6px;
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

/* Modal shared */
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
  max-height: 860px;
  border-radius: 20px;
  padding: 36px 40px 100px;
  box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.35);
  position: relative;
}
.modal.small {
  max-width: 520px;
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
.sec-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.history-section {
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}
.history-section::-webkit-scrollbar {
  width: 8px;
}
.history-section::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 8px;
}
.history-section::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 8px;
}
.history-section::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 150px;
}
.history-list li {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12px;
}
.hist-entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hist-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
.hist-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #475569;
}
.recent-box {
  background: #eef3ff;
  border: 1px solid #d1d9e6;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.book-line {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #000;
  font-family: poppins, sans-serif;
  font-size: medium;
  font-weight: 700;
}
.meta {
  font-size: 12px;
  color: #475569;
}
.actions-row {
  display: flex;
  gap: 10px;
}
.issue-box {
  margin-top: 24px;
  display: flex;
  justify-content: right;
}
.issue-btn {
  background: #063fd1;
  color: #fff;
  border: none;
  padding: 10px 22px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.issue-btn:hover {
  background: #002fa5;
}
.issue-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.f-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.f-row span {
  font-size: 13px;
  font-weight: 500;
  color: #222;
}
.f-row select,
.f-row input {
  border: 1px solid #d0d7e2;
  background: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
.save-btn {
  background: #063fd1;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .borrowers-admin {
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
