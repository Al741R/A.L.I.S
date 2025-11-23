<template>
  <section class="metrics-section">
    <div class="cards-row">
      <div class="metric-card" v-for="m in metrics" :key="m.key">
        <div class="metric-inner">
          <div class="metric-header">
            <span class="metric-label">{{ m.label }}</span>
            <span class="metric-icon" aria-hidden="true">➜</span>
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
  </section>
</template>
<script setup>
import { computed } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useBorrowingStore } from '@/stores/borrowing'

const books = useBooksStore()
const borrowing = useBorrowingStore()

const totalBooks = computed(() => books.list.length)
const issuedBooks = computed(
  () =>
    borrowing.transactions.filter((t) =>
      ['Borrowed', 'ReturnRequested', 'Overdue'].includes(t.status),
    ).length,
)
const overdueBooks = computed(
  () => borrowing.transactions.filter((t) => t.status === 'Overdue').length,
)
// Placeholder until we have an endpoint:
const registeredBorrowers = computed(() => '—')

const metrics = computed(() => [
  { key: 'total', label: 'Total Books', value: totalBooks.value },
  { key: 'issued', label: 'Issued Books', value: issuedBooks.value },
  { key: 'overdue', label: 'Overdue Books', value: overdueBooks.value },
  { key: 'borrowers', label: 'Registered Borrowers', value: registeredBorrowers.value },
])

// Weekly data
const weekData = computed(() => {
  const now = new Date()
  // Determine Monday of current week
  const day = now.getDay() // 0 Sun - 6 Sat
  const monday = new Date(now)
  const diffToMonday = (day === 0 ? -6 : 1) - day
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const results = days.map((d, i) => ({ day: d, dayShort: d, count: 0, index: i }))
  borrowing.transactions.forEach((t) => {
    const raw = t.borrowed_at || t.created_at
    if (!raw) return
    const dt = new Date(raw)
    if (isNaN(dt)) return
    // Check within week (Mon-Sat)
    const diff = dt - monday
    if (diff < 0) return
    const dayIndex = dt.getDay() // 0 Sun ... 6 Sat
    if (dayIndex === 0) return // ignore Sunday
    const mappedIndex = dayIndex - 1 // Mon=0
    if (mappedIndex >= 0 && mappedIndex < results.length) {
      results[mappedIndex].count++
    }
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
    const raw = t.borrowed_at || t.created_at
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
