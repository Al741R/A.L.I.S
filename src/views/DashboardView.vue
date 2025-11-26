<template>
  <div class="admin-dashboard">
    <DashSidebarSubsection />
    <div class="dashboard-main">
      <AdminTopBar class="frame-128-instance" />

      <!-- Statistics Overview -->
      <div class="stats-overview">
        <StatsCard
          label="Total Books"
          :value="stats.totalBooks"
          :change="stats.booksChange"
          variant="primary"
          icon="📚"
        />
        <StatsCard
          label="Active Borrowers"
          :value="stats.activeBorrowers"
          :change="stats.borrowersChange"
          variant="success"
          icon="👥"
        />
        <StatsCard
          label="Books Borrowed"
          :value="stats.booksBorrowed"
          :change="stats.borrowedChange"
          variant="warning"
          icon="📖"
        />
        <StatsCard
          label="Available Books"
          :value="stats.availableBooks"
          :change="stats.availableChange"
          variant="default"
          icon="✅"
        />
      </div>

      <FrameSubsection />
      <div class="reports-action">
        <button class="generate" @click="genReport" :disabled="generating">
          {{ generating ? 'Generating…' : 'Generate Weekly Report' }}
        </button>
        <button class="view-reports" @click="goReports">View Reports</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import DashSidebarSubsection from '@/components/admin/DashSidebarSubsection.vue'
import AdminTopBar from '@/components/admin/Frame128.vue'
import FrameSubsection from '@/components/admin/FrameSubsection.vue'
import StatsCard from '@/components/ui/StatsCard.vue'
import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useBooksStore } from '@/stores/books'
import { useBorrowingStore } from '@/stores/borrowing'
import { useUsersStore } from '@/stores/users'
import { useRouter } from 'vue-router'

const reports = useReportsStore()
const books = useBooksStore()
const borrowing = useBorrowingStore()
const users = useUsersStore()
const generating = ref(false)
const router = useRouter()

// Calculate statistics with safe defaults
const stats = computed(() => {
  // Safely access arrays with fallbacks
  const booksList = Array.isArray(books.list) ? books.list : []
  const transactionsList = Array.isArray(borrowing.transactions) ? borrowing.transactions : []

  const totalBooks = booksList.length
  const booksBorrowed = transactionsList.filter(
    (t) => t && (t.status === 'borrowed' || t.status === 'Borrowed'),
  ).length
  const availableBooks = booksList.reduce((sum, book) => sum + (book.available_copies || 0), 0)
  const activeBorrowers = new Set(
    transactionsList
      .filter((t) => t && (t.status === 'borrowed' || t.status === 'Borrowed'))
      .map((t) => t.borrower_id)
      .filter((id) => id != null),
  ).size

  return {
    totalBooks,
    booksChange: 0, // Could calculate from historical data
    activeBorrowers,
    borrowersChange: 0,
    booksBorrowed,
    borrowedChange: 0,
    availableBooks,
    availableChange: 0,
  }
})

onMounted(async () => {
  try {
    await Promise.all([
      books.fetchAll({ per_page: 200 }),
      borrowing.fetchTransactions({ per_page: 200 }),
      users.fetchAll({ per_page: 200 }),
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
})

function genReport() {
  generating.value = true
  reports.generateCurrentWeek().finally(() => (generating.value = false))
}
function goReports() {
  router.push({ name: 'reports' })
}
</script>
<style scoped>
.admin-dashboard {
  background-color: #ffffff;
  min-height: 1024px;
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: row;
  font-family: Poppins, sans-serif;
}
.dashboard-main {
  flex: 1;
  padding: 32px 48px 64px 300px; /* space for sidebar */
  box-sizing: border-box;
  background: #ecf2ff;
}
.frame-128-instance {
  position: sticky;
  top: 0;
  display: block;
  margin-bottom: 32px;
  z-index: 10;
}
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}
.reports-action {
  margin-top: 32px;
  display: flex;
  gap: 16px;
}
.generate,
.view-reports {
  background: #063fd1;
  color: #fff;
  border: none;
  padding: 12px 20px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
}
.view-reports {
  background: #fff;
  color: #063fd1;
  border: 1px solid #063fd1;
}
.view-reports:hover {
  background: #063fd1;
  color: #fff;
}
.generate:disabled {
  opacity: 0.6;
  cursor: default;
}
@media (max-width: 1024px) {
  .dashboard-main {
    padding: 32px 32px 64px 260px;
  }
}
@media (max-width: 900px) {
  .admin-dashboard {
    flex-direction: column;
    min-width: 0;
  }
  .dashboard-main {
    padding: 24px 20px 60px 20px;
  }
}
@media (max-width: 480px) {
  .reports-action {
    flex-direction: column;
  }
  .generate,
  .view-reports {
    width: 100%;
  }
}
</style>
