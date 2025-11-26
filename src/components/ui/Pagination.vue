<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div v-if="totalPages > 1" class="pagination">
    <button
      class="page-btn"
      :disabled="currentPage === 1"
      @click="goToPage(1)"
      aria-label="First page"
    >
      «
    </button>
    <button
      class="page-btn"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
      aria-label="Previous page"
    >
      ‹
    </button>

    <button
      v-for="page in visiblePages"
      :key="page"
      class="page-btn"
      :class="{ active: page === currentPage }"
      @click="goToPage(page)"
      :aria-label="`Page ${page}`"
      :aria-current="page === currentPage ? 'page' : undefined"
    >
      {{ page }}
    </button>

    <button
      class="page-btn"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
      aria-label="Next page"
    >
      ›
    </button>
    <button
      class="page-btn"
      :disabled="currentPage === totalPages"
      @click="goToPage(totalPages)"
      aria-label="Last page"
    >
      »
    </button>

    <span class="page-info"> Page {{ currentPage }} of {{ totalPages }} ({{ total }} items) </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, default: 0 },
  maxVisible: { type: Number, default: 5 }, // Max page numbers to show
})

const emit = defineEmits(['update:currentPage'])

const visiblePages = computed(() => {
  const pages = []
  const half = Math.floor(props.maxVisible / 2)
  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(props.totalPages, start + props.maxVisible - 1)

  // Adjust start if we're near the end
  if (end - start + 1 < props.maxVisible) {
    start = Math.max(1, end - props.maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

function goToPage(page) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled):not(.active) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn.active {
  background: #063fd1;
  color: white;
  border-color: #063fd1;
  cursor: default;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  margin-left: 12px;
  color: #6b7280;
  font-size: 14px;
}

@media (max-width: 768px) {
  .pagination {
    justify-content: center;
  }

  .page-info {
    width: 100%;
    text-align: center;
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
