<template>
  <div class="borrower-home">
    <!-- Logo / branding block -->
    <div class="element-wrapper">
      <img class="element" :src="borrowerLogo" alt="ALIS Borrower Logo" />
    </div>

    <!-- Top search bar (Anima frame-18) -->
    <div class="frame-18">
      <input
        v-model="search"
        ref="searchInput"
        @keydown.enter.prevent="performSearch"
        class="search-input"
        type="text"
        placeholder="Search books"
        aria-label="Search books"
      />
      <button class="search-btn" type="button" @click="focusSearch" aria-label="Focus search">
        <svg
          width="20"
          height="20"
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
      </button>
    </div>

    <!-- Top right navigation (Anima frame-93 equivalent) -->
    <div class="frame-93" role="navigation" aria-label="Primary">
      <ul class="nav-inline">
        <li v-for="item in menuItems" :key="item.id" :class="{ active: activeItem === item.id }">
          <button type="button" @click="setActiveItem(item.id)">
            <span class="nav-icon" v-html="item.icon" aria-hidden="true"></span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- Bottom decorative frame placeholder (frame-58) -->
    <div class="frame-58" aria-hidden="true"></div>

    <!-- Main content area placed relatively below nav/search -->
    <div class="content-area">
      <h1 class="page-title">{{ activeItemLabel }}</h1>
      <div v-if="activeItem === 'dashboard'" class="dashboard-panels">
        <section class="books-panel recent" aria-labelledby="recentBooksHeading">
          <header class="panel-header">
            <h2 id="recentBooksHeading">Recently borrowed books</h2>
            <button type="button" class="link-btn view-all-btn" @click="setActiveItem('borrowed')">
              View all
            </button>
          </header>
          <div class="recent-strip" v-if="recentBorrowed.length">
            <article
              v-for="t in recentBorrowed"
              :key="t.id"
              class="recent-card"
              :class="statusClass(t.book)"
              @click="openBook(t.book)"
            >
              <div class="card-gradient" :class="statusClass(t.book)"></div>
              <div class="cover-float" v-if="t.book?.cover">
                <img :src="t.book.cover" :alt="t.book.title" />
              </div>
              <div class="card-body">
                <h3 class="book-title">{{ t.book?.title || 'Untitled' }}</h3>
                <p class="book-author">{{ t.book?.author || 'Unknown Author' }}</p>
              </div>
              <div class="availability-pill" :class="statusClass(t.book)">
                {{ availabilityLabel(t.book) }}
              </div>
              <div
                v-if="t.status === 'ReturnRequested'"
                class="status-overlay-tag"
                title="Return requested; awaiting staff confirmation"
              >
                Requested
              </div>
            </article>
          </div>
          <p v-else class="empty-msg">No recent borrowed books.</p>
        </section>
        <section class="books-panel all" aria-labelledby="allBooksHeading">
          <header class="panel-header">
            <h2 id="allBooksHeading">All books</h2>
            <button
              type="button"
              class="link-btn view-all-btn"
              @click="books.fetchAll()"
              :disabled="books.loading"
            >
              View all
            </button>
          </header>
          <div class="all-grid" v-if="filteredBooks.length">
            <div
              v-for="b in filteredBooks.slice(0, 12)"
              :key="b.id"
              class="book-cell"
              @click="openBook(b)"
            >
              <div class="cover-box">
                <img v-if="b.cover" :src="b.cover" :alt="b.title" />
                <div class="status-band" :class="statusClass(b)">{{ availabilityLabel(b) }}</div>
              </div>
              <div class="meta-text">
                <p class="title-trunc">{{ b.title || 'Untitled' }}</p>
                <p class="author-trunc">{{ b.author || 'Unknown Author' }}</p>
                <p class="cat-trunc" v-if="b.subject">{{ b.subject }}</p>
              </div>
            </div>
          </div>
          <p v-else-if="!books.loading" class="empty-msg">No books found.</p>
          <p v-else class="empty-msg">Loading books…</p>
        </section>
      </div>

      <div class="panel" v-else-if="activeItem === 'browse'">
        <div class="panel-actions">
          <button class="btn" @click="books.fetchAll()" :disabled="books.loading">
            {{ books.loading ? 'Loading…' : 'Reload Books' }}
          </button>
        </div>
        <ul class="book-grid">
          <li v-for="b in filteredBooks.slice(0, 40)" :key="b.id" class="book-card">
            {{ b.title }}
          </li>
          <li v-if="!books.loading && filteredBooks.length === 0">No books found.</li>
        </ul>
      </div>

      <div class="panel" v-else-if="activeItem === 'borrowed'">
        <!-- Borrower styled list -->
        <div v-if="auth.role === 'Borrower'" class="borrowed-books-wrapper">
          <h2 class="borrowed-heading">Borrowed Books</h2>
          <div v-if="borrowing.transactions.length" class="borrowed-books-list">
            <div v-for="t in borrowing.transactions" :key="t.id" class="borrowed-item">
              <div class="borrowed-item-top">
                <h3 class="borrowed-title">{{ t.book?.title || 'Untitled Book' }}</h3>
                <button type="button" class="view-card-btn" @click="openBorrowCard(t)">
                  View Card
                </button>
              </div>
              <div class="borrowed-meta">
                <span
                  >Date Borrowed:
                  <strong>{{ formatDate(t.borrowed_at || t.created_at) }}</strong></span
                >
                <span>|</span>
                <span
                  >Due date: <strong>{{ formatDate(t.due_date) }}</strong></span
                >
                <span>|</span>
                <span>
                  Date Returned:
                  <strong>{{ t.returned_at ? formatDate(t.returned_at) : '—' }}</strong>
                </span>
              </div>
              <div class="borrowed-separator"></div>
            </div>
          </div>
          <p v-else class="empty-msg">No borrowed books.</p>
        </div>
        <!-- Non-borrower fallback original grid -->
        <template v-else>
          <ul class="book-grid">
            <li v-for="t in borrowing.transactions" :key="t.id" class="book-card">
              <span class="book-row-title">{{ t.book?.title || 'Book' }}</span>
              <span class="status-badge" :class="statusKey(t)">{{ statusLabel(t) }}</span>
              <div class="row-actions">
                <button
                  v-if="auth.role === 'Borrower' && canRequestReturn(t)"
                  class="btn small"
                  @click="returnSelected(t.id)"
                >
                  Request Return
                </button>
                <button
                  v-else-if="auth.role !== 'Borrower' && t.status === 'ReturnRequested'"
                  class="btn small"
                  @click="confirmReturn(t.id)"
                >
                  Confirm Return
                </button>
              </div>
            </li>
            <li v-if="!borrowing.loading && borrowing.transactions.length === 0">
              No borrowed books.
            </li>
          </ul>
        </template>
      </div>

      <div class="panel" v-else-if="activeItem === 'return'">
        <ul class="book-grid return-list">
          <li
            v-for="t in borrowing.transactions"
            :key="t.id"
            class="book-card"
            :class="returnStatusClass(t)"
          >
            <span class="book-row-title">{{ t.book?.title || 'Book' }}</span>
            <span class="status-badge" :class="statusKey(t)">{{ statusLabel(t) }}</span>
            <div class="row-actions">
              <button
                v-if="auth.role === 'Borrower' && canRequestReturn(t)"
                class="btn small"
                @click="returnSelected(t.id)"
              >
                Request Return
              </button>
              <button
                v-else-if="auth.role !== 'Borrower' && t.status === 'ReturnRequested'"
                class="btn small"
                @click="confirmReturn(t.id)"
              >
                Confirm Return
              </button>
              <button v-else class="btn small" disabled title="No action available for this status">
                No Action
              </button>
            </div>
          </li>
          <li v-if="borrowing.transactions.length === 0">No items to return.</li>
        </ul>
      </div>

      <!-- Profile panel now handled via overlay; keep fallback for accessibility -->
      <div class="panel" v-else-if="activeItem === 'profile' && !showProfileOverlay">
        <div v-if="auth.user" class="profile-box">
          <p><strong>Name:</strong> {{ auth.user.name }}</p>
          <p><strong>Email:</strong> {{ auth.user.email }}</p>
          <p><strong>Role:</strong> {{ auth.role }}</p>
        </div>
        <div v-else>Loading profile…</div>
      </div>

      <div class="panel" v-else-if="activeItem === 'logout'">
        <p class="logout-text">Are you sure you want to log out?</p>
        <button @click="handleLogout" class="btn danger">Logout</button>
      </div>
    </div>
    <!-- Profile / Settings Overlay -->
    <div
      v-if="showProfileOverlay"
      class="profile-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profileHeading"
    >
      <div class="profile-modal">
        <button class="close-btn" type="button" aria-label="Close" @click="closeProfile">×</button>
        <div class="modal-inner">
          <section class="section-block">
            <div class="section-head">
              <h2 id="profileHeading">Personal Information</h2>
              <button class="link-btn" type="button" @click="togglePersonalEdit">
                {{ editingPersonal ? 'Cancel' : 'Edit' }}
              </button>
            </div>
            <div class="grid-2">
              <label class="field"
                ><span class="field-label">Full Name</span>
                <input :disabled="!editingPersonal" v-model="form.name" type="text"
              /></label>
              <label class="field"
                ><span class="field-label">SID/FID</span>
                <input :disabled="!editingPersonal" v-model="form.sid" type="text"
              /></label>
              <label class="field"
                ><span class="field-label">Email</span>
                <input :disabled="!editingPersonal" v-model="form.email" type="email"
              /></label>
              <div></div>
            </div>
          </section>
          <section class="section-block">
            <div class="section-head">
              <h2>Password &amp; Security</h2>
              <button class="link-btn" type="button" @click="togglePasswordChange">
                {{ changingPassword ? 'Cancel' : 'Change' }}
              </button>
            </div>
            <div class="grid-2">
              <label class="field span-2"
                ><span class="field-label">Enter Password</span>
                <input
                  :disabled="!changingPassword"
                  v-model="form.currentPassword"
                  type="password"
                  placeholder="Enter Current Password"
              /></label>
              <label class="field"
                ><span class="field-label">New Password</span>
                <input
                  :disabled="!changingPassword"
                  v-model="form.newPassword"
                  type="password"
                  placeholder="Enter New Password"
              /></label>
              <label class="field"
                ><span class="field-label">Confirm Password</span>
                <input
                  :disabled="!changingPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="Re-Enter New Password"
              /></label>
            </div>
          </section>
          <div class="actions-row">
            <button
              class="btn save-btn"
              type="button"
              @click="saveProfile"
              :disabled="savingProfile"
            >
              {{ savingProfile ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Book Detail Modal -->
    <div
      v-if="showBookModal && selectedBook"
      class="book-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookDetailHeading"
    >
      <div class="book-modal">
        <div class="detail-card" :class="statusClass(selectedBook)">
          <div class="detail-gradient" :class="statusClass(selectedBook)"></div>
          <div class="detail-cover" v-if="selectedBook.cover">
            <img :src="selectedBook.cover" :alt="selectedBook.title" />
          </div>
          <div class="detail-body">
            <h2 id="bookDetailHeading" class="detail-title">{{ selectedBook.title }}</h2>
            <p class="detail-author" v-if="selectedBook.author">
              Author: {{ selectedBook.author }}
            </p>
            <p class="detail-category" v-if="selectedBook.subject">
              Category: {{ selectedBook.subject }}
            </p>
          </div>
          <div class="detail-pill" :class="statusClass(selectedBook)">
            {{ availabilityLabel(selectedBook) }}
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="outline-btn" @click="closeBookModal">Cancel</button>
          <button
            v-if="isAvailable(selectedBook) && auth.role !== 'Borrower'"
            type="button"
            class="primary-btn"
            @click="borrowSelected(selectedBook)"
          >
            Borrow
          </button>
        </div>
      </div>
    </div>
    <!-- Borrow Card Modal -->
    <div
      v-if="showBorrowCard && selectedTransaction"
      class="borrow-card-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="borrowCardHeading"
    >
      <div class="borrow-card-modal">
        <button class="close-btn" type="button" aria-label="Close" @click="closeBorrowCard">
          ×
        </button>
        <div class="borrow-card-inner">
          <div class="borrow-card-columns">
            <div class="borrow-card-col left">
              <h2 id="borrowCardHeading">Student Information:</h2>
              <p>
                <strong>Student ID:</strong>
                {{ auth.user?.student_number || auth.user?.sid || '—' }}
              </p>
              <p><strong>Name:</strong> {{ deriveUserName(auth.user) || '—' }}</p>
              <p><strong>Email:</strong> {{ auth.user?.email || '—' }}</p>
              <h2 class="mt-28">Book Details:</h2>
              <p><strong>Title:</strong> {{ selectedTransaction.book?.title || '—' }}</p>
              <p><strong>Author:</strong> {{ selectedTransaction.book?.author || '—' }}</p>
              <p>
                <strong>Category:</strong>
                {{ deriveBookCategory(selectedTransaction.book) || '—' }}
              </p>
              <p class="dates">
                <strong>Date Borrowed:</strong>
                {{ formatDate(selectedTransaction.borrowed_at || selectedTransaction.created_at) }}
              </p>
              <p class="dates">
                <strong>Due Date:</strong>
                <span :class="{ 'due-over': isOverdue(selectedTransaction) }">{{
                  formatDate(selectedTransaction.due_date)
                }}</span>
              </p>
            </div>
            <div class="borrow-card-col right">
              <div class="qr-box">
                <QrcodeVue :value="borrowCardValue" :size="180" level="M" :margin="2" />
              </div>
              <button
                class="download-btn"
                type="button"
                @click="downloadBorrowCard"
                aria-label="Download borrow card"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v14m0 0l-4-4m4 4l4-4" />
                  <path d="M5 21h14" />
                </svg>
              </button>
            </div>
          </div>
          <p class="borrow-note">
            Note: Please return the book on or before the due date to avoid penalties.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// =====================================================
// IMPORTS
// =====================================================
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import borrowerLogo from '@/assets/ALIS Logo transparent.png'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import { useBorrowingStore } from '@/stores/borrowing'
import { useActivityStore } from '@/stores/activity'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'

// =====================================================
// STORE INSTANCES & ROUTER
// =====================================================
const auth = useAuthStore()
const books = useBooksStore()
const borrowing = useBorrowingStore()
const activity = useActivityStore()
const router = useRouter()
const notify = useNotificationsStore()

// =====================================================
// NAVIGATION STATE (ACTIVE MENU ITEM)
// =====================================================
const activeItem = ref('dashboard')

// =====================================================
// DASHBOARD / BOOK MODAL STATE & HELPERS
// =====================================================
const recentBorrowed = computed(() => borrowing.transactions.slice(0, 6))
const showBookModal = ref(false)
const selectedBook = ref(null)
const showBorrowCard = ref(false)
const selectedTransaction = ref(null)
const borrowCardValue = computed(() => {
  if (!selectedTransaction.value) return ''
  return JSON.stringify({
    tx: selectedTransaction.value.id,
    book: selectedTransaction.value.book?.id,
    due: selectedTransaction.value.due_date,
    user: auth.user?.id,
  })
})
function openBook(book) {
  selectedBook.value = book
  showBookModal.value = true
}
function closeBookModal() {
  showBookModal.value = false
  selectedBook.value = null
}
function openBorrowCard(t) {
  selectedTransaction.value = t
  showBorrowCard.value = true
}
function closeBorrowCard() {
  showBorrowCard.value = false
  selectedTransaction.value = null
}

// =====================================================
// AVAILABILITY / BOOK STATUS HELPERS
// =====================================================
function isAvailable(book) {
  if (!book) return false
  if (book.available !== undefined) return !!book.available
  if (book.status) return ['available', 'in', 'present'].includes(String(book.status).toLowerCase())
  if (book.copies !== undefined) return book.copies > 0
  return true
}
function statusClass(book) {
  return isAvailable(book) ? 'available' : 'unavailable'
}
function availabilityLabel(book) {
  return isAvailable(book) ? 'Available' : 'Unavailable'
}
async function borrowSelected(book) {
  // Triggered by the Borrow button in the book detail modal
  if (!book || !isAvailable(book)) return
  try {
    await borrowing.createBorrow({ book_id: book.id })
    await borrowing.fetchTransactions()
    notify.push('Book borrowed successfully.', { type: 'success' })
    closeBookModal()
  } catch (err) {
    notify.push('Failed to borrow book.', { type: 'error' })
    console.error(err)
  }
}

// =====================================================
// PROFILE OVERLAY STATE & FORM DATA
// =====================================================
const showProfileOverlay = ref(false)
const editingPersonal = ref(false)
const changingPassword = ref(false)
const savingProfile = ref(false)
const form = ref({
  name: '',
  sid: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// =====================================================
// MENU ITEMS (TOP NAV)
// =====================================================
const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/></svg>`,
  },
  {
    id: 'browse',
    label: 'Browse Books',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  },
  {
    id: 'borrowed',
    label: 'My Borrowed Books',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  },
  {
    id: 'return',
    label: 'Return Books',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>`,
  },
]

// =====================================================
// DERIVED LABEL FOR CURRENT ACTIVE MENU ITEM
// =====================================================
const activeItemLabel = computed(() => {
  const found = menuItems.find((i) => i.id === activeItem.value)
  return found ? found.label : 'Dashboard'
})

// =====================================================
// SEARCH STATE (RAW / DEBOUNCED) & INPUT REF
// =====================================================
const search = ref('')
const searchInput = ref(null)
const searchDebounced = ref('')
// =====================================================
// SEARCH DEBOUNCE WATCHER
// =====================================================
let _debounceTimer = null
watch(search, (val) => {
  clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(() => {
    searchDebounced.value = val.trim()
  }, 250)
})
onUnmounted(() => clearTimeout(_debounceTimer))

// =====================================================
// FILTERED BOOKS (APPLY SEARCH QUERY)
// =====================================================
const filteredBooks = computed(() => {
  const q = searchDebounced.value
  if (!q) return books.list
  const s = q.toLowerCase()
  return books.list.filter((b) => {
    return (
      (b.title || '').toLowerCase().includes(s) ||
      (b.author || '').toLowerCase().includes(s) ||
      (b.subject || '').toLowerCase().includes(s)
    )
  })
})

// =====================================================
// SEARCH ACTION HELPERS
// =====================================================
function performSearch() {
  searchDebounced.value = (search.value || '').trim()
}
function focusSearch() {
  if (searchInput.value && typeof searchInput.value.focus === 'function') searchInput.value.focus()
}

// =====================================================
// MENU ITEM SELECTION & PROFILE OPEN
// =====================================================
function deriveUserName(u) {
  if (!u) return ''
  if (u.name) return u.name
  const parts = [u.first_name, u.last_name].filter(Boolean)
  return parts.join(' ') || ''
}
function deriveUserSid(u) {
  if (!u) return ''
  return u.student_number || u.faculty_number || u.sid || ''
}
function populateProfileForm() {
  if (auth.user) {
    form.value.name = deriveUserName(auth.user)
    form.value.email = auth.user.email || ''
    form.value.sid = deriveUserSid(auth.user)
  }
}
function setActiveItem(id) {
  activeItem.value = id
  if (id === 'profile') {
    populateProfileForm()
    showProfileOverlay.value = true
  } else {
    showProfileOverlay.value = false
  }
}
watch(
  () => auth.user,
  () => {
    if (showProfileOverlay.value) populateProfileForm()
  },
)

// =====================================================
// BORROWING / RETURN OPERATIONS
// =====================================================
async function returnSelected(id) {
  try {
    if (auth.role === 'Borrower') {
      await borrowing.requestReturn(id)
      notify.push('Return request sent. Awaiting confirmation.', { type: 'info' })
    } else {
      await borrowing.returnBook(id)
      notify.push('Book marked as returned.', { type: 'success' })
    }
  } catch (err) {
    notify.push('Failed to process return action.', { type: 'error' })
    console.error(err)
  }
}

// =====================================================
// AUTH / LOGOUT
// =====================================================
async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}

// =====================================================
// PROFILE OVERLAY ACTIONS
// =====================================================
function closeProfile() {
  showProfileOverlay.value = false
}
function togglePersonalEdit() {
  editingPersonal.value = !editingPersonal.value
}
function togglePasswordChange() {
  changingPassword.value = !changingPassword.value
  if (!changingPassword.value) {
    form.value.currentPassword = ''
    form.value.newPassword = ''
    form.value.confirmPassword = ''
  }
}
async function saveProfile() {
  if (changingPassword.value) {
    if (!form.value.newPassword || form.value.newPassword !== form.value.confirmPassword) {
      notify.push('Passwords do not match or are empty.', { type: 'error' })
      return
    }
  }
  savingProfile.value = true
  try {
    // Placeholder: send update request here when API available
    console.log('Saving profile data', { ...form.value })
    editingPersonal.value = false
    changingPassword.value = false
    await auth.fetchMe()
    notify.push('Profile saved.', { type: 'success' })
    closeProfile()
  } catch (err) {
    notify.push('Failed to save profile.', { type: 'error' })
    console.error(err)
  } finally {
    savingProfile.value = false
  }
}

// =====================================================
// LIFECYCLE INITIALIZATION (FETCH DATA ON MOUNT)
// =====================================================
onMounted(() => {
  books.fetchAll()
  borrowing.fetchTransactions()
  activity.fetchLogs()
  auth.fetchMe()
})

// =====================================================
// STATUS / RETURN FLOW HELPERS
// =====================================================
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
function returnStatusClass(t) {
  switch (t.status) {
    case 'Returned':
      return 'status-returned'
    case 'ReturnRequested':
    case 'Borrowed':
      return 'status-active'
    case 'Overdue':
      return 'status-overdue'
    case 'Lost':
      return 'status-lost'
    default:
      return ''
  }
}
function deriveBookCategory(book) {
  if (!book) return ''
  return (
    book.subject ||
    book.category ||
    book.category_name ||
    (book.category && book.category.name) ||
    (book.category && book.category.title) ||
    (Array.isArray(book.categories) && book.categories[0]) ||
    book.genre ||
    ''
  )
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
function isOverdue(t) {
  if (!t?.due_date || t?.status === 'Returned') return false
  const due = new Date(t.due_date)
  const now = new Date()
  return now > due
}
function downloadBorrowCard() {
  // Simple print-to-download approach; can be replaced with canvas export later
  window.print()
}
function canRequestReturn(t) {
  return ['Borrowed', 'Overdue'].includes(t.status)
}
async function confirmReturn(id) {
  try {
    await borrowing.returnBook(id)
    notify.push('Return confirmed.', { type: 'success' })
  } catch (err) {
    notify.push('Failed to confirm return.', { type: 'error' })
    console.error(err)
  }
}
</script>

<style scoped>
.borrower-home {
  background-color: #ffffff;
  min-height: 1035px;
  min-width: 1200px;
  position: relative;
  width: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-x: auto;
  padding-bottom: 120px;
}
.element-wrapper {
  background: url('./rectangle-39.svg') no-repeat center/100% 100%;
  display: flex;
  height: 137px;
  width: 160px;
  position: absolute;
  top: 0;
  left: 72px;
  align-items: center;
  justify-content: center;
}
.element {
  height: 200px;
  width: 149px;
  object-fit: contain;
}
.frame-18 {
  align-items: center;
  background-color: #eaf5ff;
  border-radius: 31px;
  display: inline-flex;
  gap: 0; /* icon lives inside input now */
  padding: 12px 20px;
  position: absolute;
  top: 45px;
  left: 320px;
  width: 303px; /* fix width so long text does not stretch layout */
  box-sizing: border-box;
}
.search-input {
  border: none;
  background: transparent;
  font-size: 18px;
  flex: 1;
  width: 100%;
  outline: none;
  color: #000;
  padding-left: 40px; /* space for magnifying glass */
  box-sizing: border-box;
  white-space: nowrap; /* prevent wrapping */
  overflow: hidden; /* prevent visual overflow */
}
.search-input::placeholder {
  color: rgba(0, 0, 0, 0.33);
}
.ri-search-line {
  width: 32px;
  height: 32px;
  opacity: 0.5;
  display: flex;
  align-items: center;
}
/* Reposition search button as an inline icon inside the input */
.search-btn {
  position: absolute;
  left: 32px; /* aligns within left padding area */
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
}
.search-btn svg {
  width: 22px;
  height: 22px;
}
.frame-93 {
  position: absolute;
  top: 40px;
  right: 40px;
  background: #ffffff;
  border-radius: 28px;
  padding: 8px 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.nav-inline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 12px;
}
.nav-inline li button {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 18px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.2s;
}
.nav-inline li.active button,
.nav-inline li button:hover {
  background: #eaf5ff;
}
.nav-icon svg {
  display: block;
}
.frame-58 {
  position: absolute;
  bottom: 20px;
  left: 30px;
  width: 200px;
  height: 100px;
  background: radial-gradient(circle at center, #eaf5ff, #ffffff);
  border-radius: 20px;
}
.content-area {
  position: relative;
  margin-top: 140px;
  padding: 0 72px 40px 72px;
}
.page-title {
  font-size: 32px;
  margin: 0 0 24px;
  color: #000000;
  font-family: poppins, sans-serif;
  font-weight: 600;
}

.panel {
  background: #fff;
  padding: 24px;
  border-radius: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
  color: #000000;
}
.muted {
  color: #666;
  margin-bottom: 16px;
}
.widget-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.panel-box {
  background: #fafafa;
  border: 1px solid #eee;
  padding: 16px;
  border-radius: 16px;
}
.panel-title {
  margin: 0 0 12px;
  font-size: 16px;
}
.simple-list {
  margin: 0;
  padding-left: 1.2rem;
}
.book-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  color: #000000;
}
.panel-actions {
  margin-bottom: 20px;
}
.book-card {
  background: #fff;
  border: 1px solid #ddd;
  padding: 14px;
  border-radius: 18px;
  font-size: 14px;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.return-list .book-card {
  gap: 12px;
}
.return-list .book-card.status-returned {
  background: #e6f7ec;
  border-color: #1b8553;
}
.return-list .book-card.status-active {
  background: #fff8e0;
  border-color: #c8a100;
}
.return-list .book-card.status-overdue {
  background: #ffe9e9;
  border-color: #dc2626;
}
.return-list .book-card.status-lost {
  background: #f3e5f5;
  border-color: #7e57c2;
}
.profile-box {
  background: #fafafa;
  border: 1px solid #eee;
  padding: 20px;
  border-radius: 16px;
}
.dashboard-panels {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.books-panel {
  background: #fffcfc;
  border: 1px solid #dcdfe4;
  border-radius: 14px;
  padding: 34px 40px 36px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}
.books-panel.recent {
  display: block;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 26px;
  color: #000000;
  font-family: poppins, sans-serif;
  font-weight: 500;
}
.panel-header h2 {
  font-size: 24px;
  margin: 0;
  font-weight: 600;
}
.view-all-btn {
  font-size: 14px;
}
.recent-strip {
  display: flex;
  gap: 32px;
  overflow-x: auto;
  padding: 6px 4px 10px;
}
.recent-card {
  position: relative;
  width: 300px;
  min-height: 150px;
  border-radius: 36px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 24px 24px 56px 150px;
  box-sizing: border-box;
  background: linear-gradient(90deg, #ffe4d3, #ffffff);
}
.recent-card.unavailable {
  background: linear-gradient(90deg, #d7def4, #ffffff);
}
.card-gradient {
  position: absolute;
  inset: 0;
  border-radius: 36px;
  pointer-events: none;
  mix-blend-mode: multiply;
}
.cover-float {
  position: absolute;
  top: -40px;
  left: 36px;
  width: 120px;
  height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-float img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}
.card-body .book-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #111;
}
.card-body .book-author {
  margin: 0;
  font-size: 14px;
  color: #555;
}
.availability-pill {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 10px 28px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  border-radius: 34px 0 34px 0;
  letter-spacing: 0.4px;
}
.availability-pill.available {
  background: #15803d;
}
.availability-pill.unavailable {
  background: #dc2626;
}
.status-overlay-tag {
  position: absolute;
  top: 8px;
  right: 12px;
  background: #7e57c2;
  color: #fff;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.empty-msg {
  font-size: 14px;
  color: #666;
  margin: 0;
}
.all-grid {
  display: flex;
  gap: 34px;
  flex-wrap: wrap;
}
.book-cell {
  width: 150px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
}
.cover-box {
  position: relative;
  width: 150px;
  height: 190px;
  .book-row-title {
    font-weight: 600;
    margin-bottom: 6px;
  }
  .row-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  .status-badge {
    align-self: flex-start;
    padding: 4px 10px 5px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 14px;
    color: #fff;
    letter-spacing: 0.3px;
  }
  .status-badge.borrowed {
    background: #1967d2;
  }
  .status-badge.overdue {
    background: #dc2626;
  }
  .status-badge.return-requested {
    background: #7e57c2;
  }
  .status-badge.returned {
    background: #15803d;
  }
  .status-badge.lost {
    background: #374151;
  }
  border-radius: 14px;
  background: #f5f5f5;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.cover-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.status-band {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 6px 0 10px;
  font-size: 12px;
  text-align: center;
  font-weight: 600;
  color: #fff;
}
.status-band.available {
  background: #15803d;
}
.status-band.unavailable {
  background: #dc2626;
}
.meta-text {
  font-size: 12px;
  line-height: 1.25;
}
.meta-text p {
  margin: 0 0 4px;
}
.title-trunc {
  font-weight: 600;
  color: #111;
}
.author-trunc {
  color: #444;
}
.cat-trunc {
  color: #666;
  font-size: 11px;
}
.book-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 30px;
  z-index: 3000;
}
.book-modal {
  background: #fff;
  width: 100%;
  max-width: 900px;
  border-radius: 40px;
  padding: 60px 40px 60px;
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}
.detail-card {
  position: relative;
  width: 100%;
  max-width: 520px;
  min-height: 170px;
  border-radius: 48px;
  padding: 70px 40px 70px 40px;
  background: linear-gradient(90deg, #d7def4, #ffffff);
  box-sizing: border-box;
}
.detail-card.available {
  background: linear-gradient(90deg, #ffe4d3, #ffffff);
}
.detail-gradient {
  position: absolute;
  inset: 0;
  border-radius: 48px;
  pointer-events: none;
}
.detail-cover {
  position: absolute;
  top: -70px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 210px;
}
.detail-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.detail-body {
  text-align: center;
}
.detail-title {
  font-size: 22px;
  margin: 0 0 12px;
  font-weight: 600;
  color: #111;
}
.detail-author,
.detail-category {
  margin: 0 0 4px;
  font-size: 14px;
  color: #555;
}
.detail-pill {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 12px 30px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  border-radius: 42px 0 42px 0;
}
.detail-pill.available {
  background: #15803d;
}
.detail-pill.unavailable {
  background: #dc2626;
}
.modal-actions {
  display: flex;
  gap: 28px;
}
.outline-btn,
.primary-btn {
  border: none;
  border-radius: 34px;
  padding: 16px 56px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
.outline-btn {
  background: #fff;
  border: 1px solid #111;
  color: #111;
}
.outline-btn:hover {
  background: #111;
  color: #fff;
}
.primary-btn {
  background: #1967d2;
  color: #fff;
}
.primary-btn:hover {
  background: #0f4caa;
}
@media (max-width: 900px) {
  .recent-strip {
    flex-wrap: wrap;
  }
  .recent-card {
    width: 100%;
  }
  .all-grid {
    gap: 20px;
  }
  .book-cell {
    width: 45%;
  }
  .cover-box {
    width: 100%;
  }
  .detail-card {
    padding: 60px 24px;
  }
  .book-modal {
    padding: 40px 24px 48px;
  }
}
.profile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  z-index: 2000;
}
/* Borrowed Books List (Borrower) */
.borrowed-books-wrapper {
  background: #fff;
  padding: 8px 0 0;
}
.borrowed-heading {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding: 0 32px;
  font-family: Poppins, sans-serif;
  color: #000000;
}
.borrowed-books-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.borrowed-item {
  padding: 10px 32px 4px;
}
.borrowed-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.borrowed-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #111;
}
.view-card-btn {
  background: none;
  border: none;
  color: #1967d2;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
}
.view-card-btn:hover {
  text-decoration: underline;
}
.borrowed-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #444;
  margin-top: 4px;
}
.borrowed-meta strong {
  color: #0d4d8f;
  font-weight: 600;
}
.borrowed-separator {
  height: 1px;
  background: #d9d9d9;
  margin-top: 8px;
}
.due-over {
  color: #dc2626;
}

/* Borrow Card Modal */
.borrow-card-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 30px;
  z-index: 3500;
}
.borrow-card-modal {
  background: #fff;
  width: 100%;
  max-width: 900px;
  border-radius: 34px;
  padding: 36px 40px 30px;
  box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.35);
  position: relative;
  font-family: Poppins, sans-serif;
}
.borrow-card-inner {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.borrow-card-columns {
  display: flex;
  gap: 42px;
  align-items: flex-start;
}
.borrow-card-col.left {
  flex: 1;
  min-width: 320px;
  color: #000000;
}
.borrow-card-col.right {
  width: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.borrow-card-col h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px;
}
.borrow-card-col p {
  margin: 0 0 6px;
  font-size: 13px;
  color: #222;
}
.borrow-card-col .dates {
  font-size: 12px;
  color: #333;
}
.borrow-note {
  font-size: 12px;
  text-align: center;
  color: #555;
  margin: 12px 0 4px;
}
.qr-box {
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #222;
}
.qr-placeholder {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(45deg, #000 0, #000 4px, #fff 4px, #fff 8px);
  mix-blend-mode: normal;
}
.download-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #222;
  padding: 8px;
  border-radius: 8px;
}
.download-btn:hover {
  background: #f3f3f3;
}
.mt-28 {
  margin-top: 28px;
}
@media (max-width: 900px) {
  .borrow-card-columns {
    flex-direction: column;
    gap: 24px;
  }
  .borrow-card-col.right {
    width: 100%;
  }
  .qr-box {
    width: 160px;
    height: 160px;
  }
}
.profile-modal {
  background: linear-gradient(135deg, #ffffff 10%, #f5f9ff 30%, #a7cdf8 100%);
  width: 100%;
  max-width: 860px;
  border-radius: 56px 56px 56px 56px / 56px 56px 56px 56px; /* stylized curvature */
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}
.modal-inner {
  padding: 40px 56px 56px;
}
.close-btn {
  position: absolute;
  top: 18px;
  right: 24px;
  background: transparent;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #222;
}
.section-block {
  margin-bottom: 40px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #000;
  font-family: Poppins, sans-serif;
  font-weight: 600;
  margin-bottom: 16px;
}
.section-head h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.link-btn {
  background: transparent;
  border: none;
  color: #1967d2;
  font-size: 14px;
  cursor: pointer;
}
.link-btn:hover {
  text-decoration: underline;
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 32px;
}
.grid-2 .span-2 {
  grid-column: 1 / -1;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #222;
}
.field input {
  border: 1px solid #d0d7e2;
  background: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}
.field input:disabled {
  background: #f1f5fa;
  color: #666;
}
.actions-row {
  display: flex;
  justify-content: flex-end;
}
.save-btn {
  background: #1967d2;
  border-radius: 10px;
  padding: 12px 22px;
  font-weight: 500;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .profile-modal {
    border-radius: 32px;
  }
  .modal-inner {
    padding: 32px 28px 40px;
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
.btn {
  background: #1967d2;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 10px 18px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.btn.small {
  padding: 6px 12px;
  font-size: 12px;
}
.btn:hover {
  background: #0f4caa;
}
.btn.danger {
  background: #dc3545;
}
.btn.danger:hover {
  background: #c82333;
}
.logout-text {
  margin: 0 0 16px;
}
@media (max-width: 1100px) {
  .frame-18 {
    left: 220px;
  }
  .content-area {
    padding: 0 32px 40px 32px;
  }
}
@media (max-width: 900px) {
  .borrower-home {
    min-width: 0;
    padding-top: 160px;
  }
  .frame-18,
  .frame-93,
  .element-wrapper {
    position: static;
    margin: 16px auto;
    display: flex;
  }
  .content-area {
    margin-top: 0;
  }
  .nav-inline {
    flex-wrap: wrap;
  }
}
</style>
