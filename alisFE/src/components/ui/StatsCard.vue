<template>
  <div class="stats-card" :class="[variant, { clickable: clickable }]" @click="handleClick">
    <div class="stats-icon" v-if="icon">
      <component v-if="typeof icon === 'object'" :is="icon" />
      <span v-else class="icon-emoji">{{ icon }}</span>
    </div>
    <div class="stats-content">
      <div class="stats-label">{{ label }}</div>
      <div class="stats-value">{{ formattedValue }}</div>
      <div v-if="change !== undefined" class="stats-change" :class="changeClass">
        <svg
          v-if="change !== 0"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            :d="change > 0 ? 'M5 15l7-7 7 7' : 'M5 9l7 7 7-7'"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span style="color: #000000">{{ changeText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon: { type: [Object, String], default: null },
  variant: { type: String, default: 'default' }, // default, primary, success, warning, danger
  change: { type: Number, default: undefined },
  changeLabel: { type: String, default: 'vs last week' },
  formatValue: { type: Function, default: (v) => v },
  clickable: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const formattedValue = computed(() => {
  return props.formatValue(props.value)
})

const changeClass = computed(() => {
  if (props.change === undefined || props.change === 0) return ''
  return props.change > 0 ? 'positive' : 'negative'
})

const changeText = computed(() => {
  if (props.change === undefined) return ''
  const sign = props.change > 0 ? '+' : ''
  return `${sign}${props.change}% ${props.changeLabel}`
})

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border: 2px solid transparent;
}

.stats-card.clickable {
  cursor: pointer;
}

.stats-card.clickable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stats-card.primary {
  border-color: #063fd1;
}

.stats-card.success {
  border-color: #10b981;
}

.stats-card.warning {
  border-color: #f59e0b;
}

.stats-card.danger {
  border-color: #ef4444;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-emoji {
  font-size: 24px;
  line-height: 1;
}

.stats-card.primary .stats-icon {
  background: #e0e7ff;
  color: #063fd1;
}

.stats-card.success .stats-icon {
  background: #d1fae5;
  color: #10b981;
}

.stats-card.warning .stats-icon {
  background: #fef3c7;
  color: #f59e0b;
}

.stats-card.danger .stats-icon {
  background: #fee2e2;
  color: #ef4444;
}

.stats-content {
  flex: 1;
}

.stats-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stats-change {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stats-change.positive {
  color: #10b981;
}

.stats-change.negative {
  color: #ef4444;
}

.stats-change svg {
  flex-shrink: 0;
}
</style>
