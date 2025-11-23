<template>
  <div v-if="messages && messages.length" class="error-box" role="alert" aria-live="assertive">
    <ul class="error-list">
      <li v-for="(m, i) in messages" :key="i">{{ format(m) }}</li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ value: { type: [String, Object, Array], default: null } })
function normalize(v) {
  if (!v) return []
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return [v]
  if (typeof v === 'object') {
    // Laravel validation errors { field: [msg] }
    const out = []
    Object.values(v).forEach((val) => {
      if (Array.isArray(val)) out.push(...val)
      else if (val) out.push(String(val))
    })
    return out
  }
  return [String(v)]
}
const messages = computed(() => normalize(props.value))
function format(m) {
  return m
}
</script>

<style scoped>
.error-box {
  background: #fdecea;
  color: #b91c1c;
  border: 1px solid #f5c2c0;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 18px;
  font-size: 13px;
}
.error-list {
  list-style: disc;
  margin: 0 0 0 18px;
  padding: 0;
}
</style>
