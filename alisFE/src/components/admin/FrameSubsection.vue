<template>
  <section class="metrics-section">
    <div class="cards-row">
      <div class="metric-card" v-for="m in metrics" :key="m.key" @click="openModal(m.key)">
        <div class="metric-inner">
          <div class="metric-header">
            <span class="metric-label">{{ m.label }}</span>
            <button
              class="metric-btn"
              type="button"
              @click.stop="openModal(m.key)"
              :aria-label="'Show ' + m.label + ' details'"
            >
              ⋯
            </button>
          </div>
          <div class="metric-value">{{ m.value }}</div>
        </div>
      </div>
    </div>

    <div class="layout-grid">
      <div class="panel weekly">
        <h2>Borrowed Books This Week</h2>
        <div class="bars">
          <div
            v-for="d in weekData"
            :key="d.day"
            class="bar-wrapper"
            :title="d.day + ': ' + d.count"
          >
            <div class="bar" :style="{ height: barHeight(d.count) }"></div>
            <div class="bar-label">{{ d.dayShort }}</div>
          </div>
        </div>
        <p class="total-week">Total: {{ totalWeek }}</p>
      </div>
      <div class="panel today">
        <h2>Borrowed Today</h2>
        <p class="big-number">{{ borrowedToday }}</p>
      </div>
      <div class="panel most">
        <h2>Most Borrowed Books</h2>
        <ul class="top-books" v-if="topBooks.length">
          <li v-for="(b, i) in topBooks" :key="b.id">
            <span class="rank">{{ i + 1 }}</span>
            <span class="title">{{ b.title || 'Untitled' }}</span>
            <span class="count">{{ b.count }}</span>
          </li>
        </ul>
        <p v-else class="empty">No data yet.</p>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="activeModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <button type="button" class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body" v-if="activeModal === 'total'">
          <div v-if="recentBooks.length" class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Date Added</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in recentBooks" :key="b.id">
                  <td>{{ b.title }}</td>
                  <td>{{ b.author || '—' }}</td>
                  <td>{{ formatDate(b.date_added || b.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-modal">----No added books this week----</p>
        </div>
        <div class="modal-body" v-else-if="activeModal === 'issued'">
          <div v-if="issuedList.length" class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Borrower Name</th>
                  <th>Book Title</th>
                  <th>Borrowed Date</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in issuedList" :key="t.id">
                  <td>{{ t.borrower?.first_name }} {{ t.borrower?.last_name }}</td>
                  <td>{{ t.book?.title }}</td>
                  <td>{{ formatDate(t.date_borrowed) }}</td>
                  <td>{{ formatDate(t.due_date) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-modal">----No current borrowed books----</p>
        </div>
        <div class="modal-body" v-else-if="activeModal === 'overdue'">
          <div v-if="overdueList.length" class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Borrower Name</th>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in overdueList" :key="t.id">
                  <td>{{ t.borrower?.first_name }} {{ t.borrower?.last_name }}</td>
                  <td>{{ t.book?.title }}</td>
                  <td>{{ formatDate(t.due_date) }}</td>
                  <td>{{ t.daysOverdue }}</td>
                  <td>{{ formatMoney(t.fine) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-modal">----No overdue books----</p>
        </div>
        <div class="modal-body" v-else-if="activeModal === 'borrowers'">
          <div v-if="weeklyRegisteredBorrowers.length" class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in weeklyRegisteredBorrowers" :key="u.id">
                  <td>{{ u.full_name || u.first_name + ' ' + u.last_name }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ formatDate(u.date_registered || u.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-modal">----No new registered borrower this week----</p>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup>
import { computed, ref, onMounted } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useBorrowingStore } from '@/stores/borrowing'
import { useUsersStore } from '@/stores/users'

const DAILY_FINE = 10 // keep in sync with backend constant

const books = useBooksStore()
const borrowing = useBorrowingStore()
const users = useUsersStore()

onMounted(() => {
  // Fetch data (increase per_page to capture larger set for dashboard)
  books.fetchAll({ per_page: 200 }).catch(() => {})
  borrowing.fetchTransactions({ per_page: 200 }).catch(() => {})
  users.fetchAll({ per_page: 200 }).catch(() => {})
})

// Modal state
const activeModal = ref(null)
function openModal(key) {
  activeModal.value = key
}
function closeModal() {
  activeModal.value = null
}
const modalTitle = computed(() => {
  switch (activeModal.value) {
    case 'total':
      return 'Added Books'
    case 'issued':
      return 'Borrowed Books'
    case 'overdue':
      return 'Overdue Books'
    case 'borrowers':
      return 'Registered Borrowers'
    default:
      return ''
  }
})

const totalBooks = computed(() => books.list.length)
const issuedBooks = computed(
  () =>
    borrowing.transactions.filter(
      (t) => !t.date_returned && ['Borrowed', 'ReturnRequested', 'Overdue'].includes(t.status),
    ).length,
)
const overdueBooks = computed(
  () =>
    borrowing.transactions.filter(
      (t) => !t.date_returned && t.due_date && new Date(t.due_date) < new Date(),
    ).length,
)
const registeredBorrowersCount = computed(() => users.borrowers.length)

const metrics = computed(() => [
  { key: 'total', label: 'Total Books', value: totalBooks.value },
  { key: 'issued', label: 'Issued Books', value: issuedBooks.value },
  { key: 'overdue', label: 'Overdue Books', value: overdueBooks.value },
  { key: 'borrowers', label: 'Registered Borrowers', value: registeredBorrowersCount.value },
])

// Recently added books (within last 7 days)
const recentBooks = computed(() => {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  return books.list
    .filter((b) => {
      const raw = b.date_added || b.created_at
      if (!raw) return false
      const dt = new Date(raw)
      return dt >= start && dt <= now
    })
    .sort((a, b) => new Date(b.date_added || b.created_at) - new Date(a.date_added || a.created_at))
    .slice(0, 50)
})

// Issued list
const issuedList = computed(() =>
  borrowing.transactions.filter(
    (t) => !t.date_returned && ['Borrowed', 'ReturnRequested', 'Overdue'].includes(t.status),
  ),
)

// Overdue list with computed days & fine
const overdueList = computed(() => {
  const today = new Date()
  return borrowing.transactions
    .filter((t) => !t.date_returned && t.due_date && new Date(t.due_date) < today)
    .map((t) => {
      const due = new Date(t.due_date)
      const days = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)))
      return { ...t, daysOverdue: days, fine: days * DAILY_FINE }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
})

// Weekly registered borrowers (last 7 days)
const weeklyRegisteredBorrowers = computed(() => {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  return users.borrowers
    .filter((u) => {
      const raw = u.date_registered || u.created_at
      if (!raw) return false
      const dt = new Date(raw)
      return dt >= start && dt <= now
    })
    .sort(
      (a, b) =>
        new Date(b.date_registered || b.created_at) - new Date(a.date_registered || a.created_at),
    )
})

// Weekly data (bars) borrowed counts by weekday
const weekData = computed(() => {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  const diffToMonday = (day === 0 ? -6 : 1) - day
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const results = days.map((d) => ({ day: d, dayShort: d, count: 0 }))
  borrowing.transactions.forEach((t) => {
    const raw = t.date_borrowed || t.borrowed_at || t.created_at
    if (!raw) return
    const dt = new Date(raw)
    if (isNaN(dt)) return
    if (dt < monday) return
    const dayIndex = dt.getDay()
    if (dayIndex === 0) return
    const mappedIndex = dayIndex - 1
    if (mappedIndex >= 0 && mappedIndex < results.length) results[mappedIndex].count++
  })
  return results
})
const totalWeek = computed(() => weekData.value.reduce((a, b) => a + b.count, 0))

const borrowedToday = computed(() => {
  const today = new Date()
  const y = today.getFullYear(),
    m = today.getMonth(),
    d = today.getDate()
  return borrowing.transactions.filter((t) => {
    const raw = t.date_borrowed || t.borrowed_at || t.created_at
    if (!raw) return false
    const dt = new Date(raw)
    return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
  }).length
})

const topBooks = computed(() => {
  const freq = new Map()
  borrowing.transactions.forEach((t) => {
    if (!t.book?.id) return
    const key = t.book.id
    freq.set(key, freq.get(key) || { id: key, title: t.book.title, count: 0 })
    freq.get(key).count++
  })
  return Array.from(freq.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
})

function barHeight(count) {
  const max = Math.max(1, ...weekData.value.map((d) => d.count))
  const pct = count / max
  return Math.round(120 * pct) + 'px'
}
function formatDate(v) {
  if (!v) return '—'
  const dt = new Date(v)
  if (isNaN(dt)) return '—'
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}
function formatMoney(n) {
  if (typeof n !== 'number') return '—'
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  })
}
</script>
<style scoped>
.metrics-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}
.metric-card {
  background: #ffffff;
  border: 1px solid #d9e1ef;
  padding: 0;
  border-radius: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  position: relative;
  min-height: 140px;
  display: flex;
}
.metric-inner {
  padding: 22px 24px 18px;
  display: flex;
  flex-direction: column;
  width: 100%;
}
.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 12px;
}
.metric-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.metric-btn {
  background: #f1f5f9;
  border: 0;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  color: #475569;
  transition: background 0.15s;
}
.metric-btn:hover {
  background: #e2e8f0;
}
.metric-icon {
  font-size: 16px;
  color: #64748b;
}
.metric-value {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 1px;
  color: #083d8b;
}
.layout-grid {
  display: grid;
  gap: 32px;
  grid-template-columns: 1.2fr 0.6fr 1fr;
}
.panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  padding: 24px 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  color: #111827;
}
.panel h2 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
}
.weekly .bars {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  height: 140px;
  margin-bottom: 8px;
}
.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.bar {
  width: 26px;
  background: linear-gradient(180deg, #1967d2, #4090ff);
  border-radius: 8px 8px 4px 4px;
  transition: height 0.3s;
}
.bar-label {
  font-size: 11px;
  color: #334155;
  font-weight: 500;
}
.total-week {
  font-size: 12px;
  margin: 0;
  color: #475569;
  font-weight: 500;
}
.today .big-number {
  font-size: 54px;
  font-weight: 700;
  margin: 12px 0;
  line-height: 1;
  color: #1967d2;
}
.most .top-books {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.top-books li {
  display: grid;
  grid-template-columns: 28px 1fr 50px;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 12px;
}
.top-books .rank {
  font-weight: 700;
  color: #1967d2;
}
.top-books .title {
  font-weight: 600;
  color: #1e293b;
}
.top-books .count {
  font-weight: 600;
  text-align: right;
  color: #0d4d8f;
}
.empty {
  font-size: 13px;
  color: #64748b;
}
/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
  z-index: 1000;
}
.modal-card {
  width: min(880px, 95%);
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}
.close-btn {
  background: none;
  border: 0;
  font-size: 20px;
  cursor: pointer;
  color: #64748b;
}
.close-btn:hover {
  color: #0f172a;
}
.modal-body {
  padding: 18px 22px 26px;
  overflow: auto;
  color:#083d8b
}
.empty-modal {
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  margin: 50px 0;
}
.table-wrapper {
  overflow: auto;
}
.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table-wrapper th,
.table-wrapper td {
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  text-align: left;
}
.table-wrapper th {
  background: #f8fafc;
  font-weight: 600;
}
.table-wrapper tbody tr:nth-child(even) {
  background: #f1f5f9;
}
@media (max-width: 1400px) {
  .layout-grid {
    grid-template-columns: 1fr 1fr;
  }
  .most {
    order: 3;
  }
}
@media (max-width: 1000px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
