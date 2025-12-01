<template>
  <div class="advanced-filters" :class="{ expanded }">
    <button class="filter-toggle" @click="expanded = !expanded">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 6h16M4 12h16M4 18h16" stroke-width="2" stroke-linecap="round" />
      </svg>
      {{ expanded ? 'Hide Filters' : 'Show Filters' }}
      <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
    </button>

    <Transition name="slide-down">
      <div v-if="expanded" class="filter-content">
        <div class="filter-grid">
          <!-- Status Filter -->
          <div class="filter-group" v-if="showStatus">
            <label class="filter-label">Status</label>
            <select v-model="localFilters.status" class="filter-select">
              <option value="">All</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <!-- Category Filter -->
          <div class="filter-group" v-if="showCategory">
            <label class="filter-label">Category</label>
            <select v-model="localFilters.category" class="filter-select">
              <option value="">All Categories</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.category_name">
                {{ cat.category_name }}
              </option>
            </select>
          </div>

          <!-- Year Range -->
          <div class="filter-group" v-if="showYear">
            <label class="filter-label">Year From</label>
            <input
              type="number"
              v-model.number="localFilters.yearFrom"
              placeholder="e.g., 2000"
              class="filter-input"
              min="1900"
              :max="currentYear"
            />
          </div>

          <div class="filter-group" v-if="showYear">
            <label class="filter-label">Year To</label>
            <input
              type="number"
              v-model.number="localFilters.yearTo"
              placeholder="e.g., 2024"
              class="filter-input"
              min="1900"
              :max="currentYear"
            />
          </div>

          <!-- Author Filter -->
          <div class="filter-group" v-if="showAuthor">
            <label class="filter-label">Author</label>
            <input
              type="text"
              v-model="localFilters.author"
              placeholder="Search by author"
              class="filter-input"
            />
          </div>

          <!-- Availability Range -->
          <div class="filter-group" v-if="showAvailability">
            <label class="filter-label">Min Available</label>
            <input
              type="number"
              v-model.number="localFilters.minAvailable"
              placeholder="0"
              class="filter-input"
              min="0"
            />
          </div>
        </div>

        <div class="filter-actions">
          <button class="btn-clear" @click="clearFilters">Clear All</button>
          <button class="btn-apply" @click="applyFilters">Apply Filters</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  categories: { type: Array, default: () => [] },
  showStatus: { type: Boolean, default: true },
  showCategory: { type: Boolean, default: true },
  showYear: { type: Boolean, default: true },
  showAuthor: { type: Boolean, default: true },
  showAvailability: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'apply'])

const expanded = ref(false)
const currentYear = new Date().getFullYear()

const localFilters = ref({
  status: props.modelValue.status || '',
  category: props.modelValue.category || '',
  yearFrom: props.modelValue.yearFrom || null,
  yearTo: props.modelValue.yearTo || null,
  author: props.modelValue.author || '',
  minAvailable: props.modelValue.minAvailable || null,
})

const activeFilterCount = computed(() => {
  let count = 0
  if (localFilters.value.status) count++
  if (localFilters.value.category) count++
  if (localFilters.value.yearFrom) count++
  if (localFilters.value.yearTo) count++
  if (localFilters.value.author) count++
  if (localFilters.value.minAvailable) count++
  return count
})

function applyFilters() {
  emit('update:modelValue', { ...localFilters.value })
  emit('apply', { ...localFilters.value })
}

function clearFilters() {
  localFilters.value = {
    status: '',
    category: '',
    yearFrom: null,
    yearTo: null,
    author: '',
    minAvailable: null,
  }
  applyFilters()
}

// Auto-expand if filters are pre-set
watch(
  () => props.modelValue,
  (newVal) => {
    if (Object.values(newVal).some((v) => v)) {
      expanded.value = true
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.advanced-filters {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.filter-toggle {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: background 0.2s;
  border-radius: 8px;
}

.filter-toggle:hover {
  background: #f9fafb;
}

.filter-toggle svg {
  color: #6b7280;
}

.filter-badge {
  background: #063fd1;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: auto;
}

.filter-content {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  background: white;
  transition: border-color 0.2s;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #063fd1;
  box-shadow: 0 0 0 3px rgba(6, 63, 209, 0.1);
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-clear,
.btn-apply {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-clear {
  background: #f3f4f6;
  color: #374151;
}

.btn-clear:hover {
  background: #e5e7eb;
}

.btn-apply {
  background: #063fd1;
  color: white;
}

.btn-apply:hover {
  background: #0532a8;
}

/* Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 500px;
  opacity: 1;
}

@media (max-width: 768px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
