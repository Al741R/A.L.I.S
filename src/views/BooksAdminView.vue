<template>
  <div class="books-admin">
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
        <input v-model="search" placeholder="Search books or authors" />
      </div>
      <select v-model="categoryFilter" class="cat-filter">
        <option value="">All</option>
        <option v-for="c in books.categories" :key="c.id || c" :value="catName(c)">
          {{ catName(c) }}
        </option>
      </select>
      <input
        ref="csvInput"
        type="file"
        accept="text/csv,text/plain"
        @change="onCsvSelect"
        style="display: none"
      />
      <button class="outline" type="button" @click="triggerCsvImport">Import CSV</button>
      <button class="new-btn" type="button" @click="openCreate">+ New Book</button>
      <button class="close-page" type="button" @click="goDashboard" aria-label="Close Books Page">
        ×
      </button>
    </div>

    <div class="table-wrapper" v-if="filtered.length">
      <table class="books-table">
        <thead>
          <tr>
            <th @click="setSort('book_code')">
              BookID <span class="sort">{{ sortLabel('book_code') }}</span>
            </th>
            <th>Image</th>
            <th @click="setSort('title')">
              Book Title <span class="sort">{{ sortLabel('title') }}</span>
            </th>
            <th @click="setSort('author')">
              Author <span class="sort">{{ sortLabel('author') }}</span>
            </th>
            <th @click="setSort('category')">
              Category <span class="sort">{{ sortLabel('category') }}</span>
            </th>
            <th @click="setSort('total_copies')">
              Qty (Total) <span class="sort">{{ sortLabel('total_copies') }}</span>
            </th>
            <th @click="setSort('available_copies')">
              Qty (Avail) <span class="sort">{{ sortLabel('available_copies') }}</span>
            </th>
            <th @click="setSort('borrowed')">
              Qty (Borrowed) <span class="sort">{{ sortLabel('borrowed') }}</span>
            </th>
            <th @click="setSort('status')">
              Status <span class="sort">{{ sortLabel('status') }}</span>
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in paged" :key="b?.id || b?.book_code || b?.code || b?.title">
            <td>{{ b?.book_code || b?.code || b?.id || '—' }}</td>
            <td class="img-cell">
              <a v-if="b.cover" :href="b.cover" target="_blank">{{ coverFile(b.cover) }}</a>
              <img v-else-if="b._cover_preview" :src="b._cover_preview" alt="cover" class="thumb" />
              <span v-else>—</span>
            </td>
            <td>{{ b.title }}</td>
            <td>{{ b.author || '—' }}</td>
            <td>
              <span class="cat-pill" :class="catClass(b)">{{ bookCategory(b) }}</span>
            </td>
            <td>{{ totalQty(b) }}</td>
            <td>{{ availableQty(b) }}</td>
            <td>{{ borrowedQty(b) }}</td>
            <td>
              <span class="status-pill" :class="statusClass(b)">{{
                isAvailable(b) ? 'Available' : 'Unavailable'
              }}</span>
            </td>
            <td class="action-cell">
              <button class="icon-btn" @click="openEdit(b)" title="Edit">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button class="icon-btn" @click="confirmDelete(b)" title="Delete">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
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
    <p v-else class="empty">No books found.</p>

    <!-- Add/Edit Modal -->
    <div
      v-if="showModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="closeModal"
    >
      <div class="modal">
        <button class="close" @click="closeModal" aria-label="Close">×</button>
        <h2 class="modal-title">{{ editing ? 'Edit Book' : 'Add New Book' }}</h2>
        <form @submit.prevent="saveBook" class="book-form">
          <label class="f-row">
            <span>Book Title</span>
            <input v-model="form.title" required />
          </label>
          <label class="f-row">
            <span>Author(s)</span>
            <input v-model="form.author" />
          </label>
          <label class="f-row">
            <span>BookID</span>
            <input v-model="form.book_code" placeholder="ENG-101" />
          </label>
          <div class="grid-2">
            <label class="f-row">
              <span>Category</span>
              <select v-model="form.category">
                <option value="">Select Category</option>
                <option v-for="c in books.categories" :key="catName(c)" :value="catName(c)">
                  {{ catName(c) }}
                </option>
              </select>
            </label>
            <label class="f-row">
              <span>Quantity</span>
              <input type="number" min="0" v-model.number="form.copies" />
            </label>
          </div>
          <label class="f-row">
            <span>Cover Image</span>
            <div class="cover-row">
              <input type="file" accept="image/*" @change="handleCoverFile" />
              <input v-model="form.cover" placeholder="Or enter image URL (optional)" />
            </div>
            <div v-if="coverPreview" class="cover-preview">
              <img :src="coverPreview" alt="preview" />
              <button type="button" class="outline" @click="clearCover">Remove</button>
            </div>
          </label>
          <div class="actions">
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDelete" class="modal-overlay" role="dialog" aria-modal="true">
      <div class="confirm-box">
        <p>Are you sure you want to delete this record?</p>
        <div class="row">
          <button class="outline" @click="showDelete = false">Cancel</button>
          <button class="danger" @click="doDelete" :disabled="deleting">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useBorrowingStore } from '@/stores/borrowing'
import { useNotificationsStore } from '@/stores/notifications'

const books = useBooksStore()
const borrowing = useBorrowingStore()
const notify = useNotificationsStore()

const search = ref('')
const categoryFilter = ref('')
const page = ref(1)
const perPage = 25

// Sorting
const sortBy = ref('')
const sortDir = ref('asc')

// CSV import & file upload
const csvInput = ref(null)
const coverFileRef = ref(null)
const coverPreview = ref('')
import { useRouter } from 'vue-router'
const localRouter = useRouter()
function goDashboard() {
  localRouter.push({ name: 'dashboard' })
}

const showModal = ref(false)
const editing = ref(false)
const saving = ref(false)
const showDelete = ref(false)
const deleting = ref(false)
const targetBook = ref(null)

const form = ref({ title: '', author: '', book_code: '', category: '', copies: 0, cover: '' })

function catName(c) {
  if (!c) return '—'
  if (typeof c === 'string') return c
  return (
    c.category_name || c.name || c.title || c.label || c.slug || c.code || c.id?.toString() || '—'
  )
}
function bookCategory(b) {
  if (!b) return '—'
  // Support nested category object or plain string
  const raw = b.subject || b.category || b.genre || b.category_name || b.categoryName
  if (!raw) return '—'
  return typeof raw === 'string' ? raw : catName(raw)
}
function isAvailable(b) {
  if (b.available_copies !== undefined) return b.available_copies > 0
  if (b.copies !== undefined) return b.copies > 0
  return true
}
function statusClass(b) {
  return isAvailable(b) ? 'avail' : 'unavail'
}
function totalQty(b) {
  return b.copies ?? 0
}
function availableQty(b) {
  return (
    b.available_copies ??
    (b.total_copies != null && b._borrowed_count != null ? b.total_copies - b._borrowed_count : 0)
  )
}
function borrowedQty(b) {
  // Prefer normalized field from backend if provided
  if (b._borrowed_count != null) return b._borrowed_count
  return borrowing.transactions.filter(
    (t) => t.book?.id === b.id && ['Borrowed', 'ReturnRequested', 'Overdue'].includes(t.status),
  ).length
}
function coverFile(url) {
  try {
    return url.split('/').pop()
  } catch {
    return 'image'
  }
}
function catClass(b) {
  const base = bookCategory(b)
  const c = (typeof base === 'string' ? base : '').toLowerCase()
  if (/math/.test(c)) return 'c-math'
  if (/fic/.test(c)) return 'c-fic'
  if (/sci/.test(c)) return 'c-sci'
  if (/eng/.test(c)) return 'c-eng'
  return 'c-generic'
}

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  const base = Array.isArray(books.list) ? books.list.filter((x) => x && typeof x === 'object') : []
  return base
    .map((b) => ({ ...b, _normCategory: bookCategory(b) }))
    .filter((b) => {
      const matchTerm =
        !term ||
        (b.title || '').toLowerCase().includes(term) ||
        (b.author || '').toLowerCase().includes(term)
      const matchCat = !categoryFilter.value || b._normCategory === categoryFilter.value
      return matchTerm && matchCat
    })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

// Keep page within bounds when filtered list changes
watch([filtered, totalPages], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

const sorted = computed(() => {
  const arr = filtered.value.slice()
  if (!sortBy.value) return arr
  const dir = sortDir.value === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    let va = ''
    let vb = ''
    switch (sortBy.value) {
      case 'book_code':
        va = a.book_code || a.code || ''
        vb = b.book_code || b.code || ''
        break
      case 'title':
        va = a.title || ''
        vb = b.title || ''
        break
      case 'author':
        va = a.author || ''
        vb = b.author || ''
        break
      case 'category':
        va = bookCategory(a)
        vb = bookCategory(b)
        break
      case 'copies':
        return (totalQty(a) - totalQty(b)) * dir
      case 'borrowed':
        return (borrowedQty(a) - borrowedQty(b)) * dir
      case 'status':
        return (isAvailable(a) === isAvailable(b) ? 0 : isAvailable(a) ? -1 : 1) * dir
      default:
        va = ''
        vb = ''
    }
    return va.toString().localeCompare(vb.toString()) * dir
  })
  return arr
})

const paged = computed(() => {
  const start = (page.value - 1) * perPage
  return sorted.value.slice(start, start + perPage)
})

function openCreate() {
  editing.value = false
  showModal.value = true
  form.value = { title: '', author: '', book_code: '', category: '', copies: 0, cover: '' }
}
function openEdit(b) {
  editing.value = true
  showModal.value = true
  targetBook.value = b
  form.value = {
    title: b.title,
    author: b.author,
    book_code: b.book_code || b.code || '',
    category: bookCategory(b),
    copies: b.copies ?? 0,
    cover: b.cover || '',
  }
}
function closeModal() {
  showModal.value = false
}
async function saveBook() {
  saving.value = true
  try {
    // Prepare payload (support FormData when user provided a file)
    const hasFile = !!coverFileRef.value
    let payload = null
    if (hasFile) {
      const fd = new FormData()
      fd.append('title', form.value.title || '')
      fd.append('author', form.value.author || '')
      fd.append('book_code', form.value.book_code || '')
      fd.append('category', form.value.category || '')
      fd.append('copies', String(form.value.copies ?? 0))
      if (form.value.cover) fd.append('cover_url', form.value.cover)
      fd.append('cover', coverFileRef.value)
      payload = fd
    } else {
      payload = { ...form.value }
    }

    if (editing.value && targetBook.value) {
      await books.update(targetBook.value.id, payload)
      notify.push('Book updated.', { type: 'success' })
    } else {
      await books.create(payload)
      notify.push('Book created.', { type: 'success' })
    }
    showModal.value = false
  } catch (err) {
    notify.push('Save failed.', { type: 'error' })
    console.error(err)
  } finally {
    saving.value = false
  }
}
function confirmDelete(b) {
  targetBook.value = b
  showDelete.value = true
}
async function doDelete() {
  deleting.value = true
  try {
    await books.remove(targetBook.value.id)
    notify.push('Book deleted.', { type: 'success' })
    showDelete.value = false
  } catch {
    notify.push('Delete failed.', { type: 'error' })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  books.fetchAll()
  books.fetchCategories()
  borrowing.fetchTransactions()
  // defensive: ensure overlays start hidden
  showModal.value = false
  showDelete.value = false
})

// Debug overlay opens (helps investigate "black page" modal issue)
watch([showModal, showDelete], ([m, d]) => {
  if (m) console.debug('[Books] showModal opened')
  if (d) console.debug('[Books] showDelete opened')
})

onBeforeUnmount(() => {
  // Clean up any stray overlay nodes if navigation happens while modal open
  showModal.value = false
  showDelete.value = false
  document.querySelectorAll('.modal-overlay').forEach((el) => {
    if (el.parentElement?.classList.contains('books-admin')) return
    // remove orphaned overlays (safety)
    if (!document.body.contains(el)) return
  })
})

// Sorting helpers
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

// CSV import
function triggerCsvImport() {
  csvInput.value?.click()
}
async function onCsvSelect(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  await importCsv(f)
  e.target.value = ''
}
async function importCsv(file) {
  notify.push('Importing CSV…', { type: 'info' })
  try {
    const text = await file.text()
    const rows = text.split(/\r?\n/).filter((r) => r.trim())
    if (!rows.length) throw new Error('Empty file')
    const headers = rows
      .shift()
      .split(',')
      .map((h) => h.trim().toLowerCase())
    const created = []
    for (const line of rows) {
      const cols = line.split(',').map((c) => c.trim())
      const obj = {}
      headers.forEach((h, i) => (obj[h] = cols[i] ?? ''))
      const payload = {
        title: obj.title || obj.name || '',
        author: obj.author || '',
        book_code: obj.book_code || obj.code || '',
        category: obj.category || '',
        copies: Number(obj.copies || obj.qty || 0),
        cover: obj.cover || '',
      }
      await books.create(payload)
      created.push(payload)
    }
    notify.push(`Imported ${created.length} books.`, { type: 'success' })
    books.fetchAll()
  } catch (err) {
    console.error(err)
    notify.push('CSV import failed.', { type: 'error' })
  }
}

// Cover file handling
function handleCoverFile(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  coverFileRef.value = f
  coverPreview.value = URL.createObjectURL(f)
}
function clearCover() {
  coverFileRef.value = null
  coverPreview.value = ''
  form.value.cover = ''
}
</script>
<style scoped>
.books-admin {
  padding: 32px 48px 64px 300px;
  font-family: Poppins, sans-serif;
  background: #fff;
  min-height: 1024px;
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
.cat-filter {
  background: #fff;
  border: 1px solid #d1d9e6;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
}
.new-btn {
  background: #063fd1;
  color: #fff;
  font-weight: 600;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
}
.new-btn:hover {
  background: #002fa5;
}
.close-page {
  background: #fff;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  font-size: 18px;
  line-height: 1;
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
.books-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #111827;
}
.books-table th {
  text-align: left;
  background: #f8fafc;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.books-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eef2f6;
}
.books-table tbody tr:hover {
  background: #f5f9ff;
}
.img-cell a {
  color: #0d4d8f;
  text-decoration: underline;
}
.cat-pill {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.c-math {
  background: #f87171;
  color: #111;
}
.c-fic {
  background: #fef08a;
  color: #111;
}
.c-sci {
  background: #93c5fd;
  color: #111;
}
.c-eng {
  background: #d8b4fe;
  color: #111;
}
.c-generic {
  background: #e2e8f0;
  color: #111;
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
  background: #15803d;
}
.status-pill.unavail::before {
  background: #dc2626;
}
.status-pill.unavail {
  color: #b91c1c;
}
.action-cell {
  display: flex;
  gap: 4px;
}
.icon-btn {
  background: transparent;
  border: 1px solid #cbd5e1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
}
.icon-btn:hover {
  background: #f1f5f9;
}
.thumb {
  width: 40px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
}
.sort {
  font-size: 12px;
  color: #64748b;
  margin-left: 6px;
}
.cover-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.cover-preview {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  align-items: center;
}
.cover-preview img {
  width: 96px;
  height: 128px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
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
/* Modal */
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
.book-form {
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
.f-row input,
.f-row select {
  border: 1px solid #d0d7e2;
  background: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
.save-btn {
  background: #063fd1;
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.confirm-box {
  background: #fff;
  width: 100%;
  max-width: 320px;
  border-radius: 12px;
  padding: 28px 26px 24px;
  box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.35);
}
.confirm-box p {
  margin: 0 0 18px;
  font-size: 14px;
  font-weight: 500;
}
.confirm-box .row {
  display: flex;
  gap: 12px;
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
.danger {
  background: #063fd1;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.danger:hover {
  background: #002fa5;
}
@media (max-width: 900px) {
  .books-admin {
    padding: 24px 20px 60px 20px;
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
