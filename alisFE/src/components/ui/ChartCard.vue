<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <span v-if="subtitle" class="chart-subtitle">{{ subtitle }}</span>
    </div>
    <div class="chart-body">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  type: { type: String, default: 'bar' }, // bar, line, pie, doughnut
  data: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
  height: { type: Number, default: 300 },
})

const chartCanvas = ref(null)
let chartInstance = null

// Note: This is a placeholder. In production, you would import Chart.js
// import Chart from 'chart.js/auto'

// eslint-disable-next-line no-unused-vars
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 15,
        font: { size: 12, family: 'Poppins, sans-serif' },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      borderColor: '#063fd1',
      borderWidth: 1,
    },
  },
}

function createChart() {
  if (!chartCanvas.value) return

  // Simple fallback visualization without Chart.js
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height)

  // Draw placeholder text
  ctx.font = '16px Poppins, sans-serif'
  ctx.fillStyle = '#6b7280'
  ctx.textAlign = 'center'
  ctx.fillText(
    'Chart.js not loaded - Add to package.json',
    chartCanvas.value.width / 2,
    chartCanvas.value.height / 2,
  )

  // For actual implementation, uncomment:
  /*
  const mergedOptions = { ...defaultOptions, ...props.options }

  chartInstance = new Chart(chartCanvas.value, {
    type: props.type,
    data: props.data,
    options: mergedOptions,
  })
  */
}

function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

onMounted(() => {
  createChart()
})

watch(
  () => props.data,
  () => {
    destroyChart()
    createChart()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  destroyChart()
})
</script>

<style scoped>
.chart-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  margin-bottom: 20px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.chart-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.chart-body {
  position: relative;
  height: 300px;
}

canvas {
  max-width: 100%;
}
</style>
