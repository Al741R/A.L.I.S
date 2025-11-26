<template>
  <div class="table-skeleton">
    <div class="skeleton-row" v-for="i in rows" :key="i">
      <div class="skeleton-cell" v-for="j in columns" :key="j">
        <SkeletonLoader :variant="j === 1 ? 'avatar' : 'text'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import SkeletonLoader from './SkeletonLoader.vue'

defineProps({
  rows: { type: Number, default: 5 },
  columns: { type: Number, default: 6 },
})
</script>

<style scoped>
.table-skeleton {
  width: 100%;
}

.skeleton-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-cell {
  min-height: 40px;
  display: flex;
  align-items: center;
}
</style>
