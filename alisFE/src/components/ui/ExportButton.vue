<template>
  <div class="export-button-group">
    <button
      v-if="formats.includes('csv')"
      @click="handleExport('csv')"
      :disabled="loading || disabled"
      class="export-button csv"
      title="Export to CSV"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      <span>{{ csvLabel }}</span>
    </button>

    <button
      v-if="formats.includes('excel')"
      @click="handleExport('excel')"
      :disabled="loading || disabled"
      class="export-button excel"
      title="Export to Excel"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
      <span>{{ excelLabel }}</span>
    </button>

    <button
      v-if="formats.includes('pdf')"
      @click="handleExport('pdf')"
      :disabled="loading || disabled"
      class="export-button pdf"
      title="Export to PDF"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="9" y1="13" x2="9" y2="17"></line>
        <line x1="15" y1="13" x2="15" y2="17"></line>
      </svg>
      <span>{{ pdfLabel }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useExport } from '@/composables/useExport'

const props = defineProps({
  /**
   * Data to export
   */
  data: {
    type: Array,
    required: true,
  },

  /**
   * Export filename (without extension)
   */
  filename: {
    type: String,
    default: 'export',
  },

  /**
   * Columns to include in export
   */
  columns: {
    type: Array,
    default: null,
  },

  /**
   * Export formats to show
   */
  formats: {
    type: Array,
    default: () => ['csv', 'excel', 'pdf'],
    validator: (value) => {
      return value.every((format) => ['csv', 'excel', 'pdf'].includes(format))
    },
  },

  /**
   * PDF title (for PDF export)
   */
  title: {
    type: String,
    default: 'Export Report',
  },

  /**
   * Disable export buttons
   */
  disabled: {
    type: Boolean,
    default: false,
  },

  /**
   * Button labels
   */
  csvLabel: {
    type: String,
    default: 'CSV',
  },

  excelLabel: {
    type: String,
    default: 'Excel',
  },

  pdfLabel: {
    type: String,
    default: 'PDF',
  },
})

const emit = defineEmits(['export-start', 'export-complete', 'export-error'])

const { exportToCSV, exportToPDF, exportToExcel } = useExport()
const loading = ref(false)

async function handleExport(format) {
  if (!props.data || props.data.length === 0) {
    console.warn('No data to export')
    return
  }

  loading.value = true
  emit('export-start', format)

  try {
    switch (format) {
      case 'csv':
        exportToCSV(props.data, props.filename, props.columns)
        break

      case 'excel':
        exportToExcel(props.data, props.filename, props.columns)
        break

      case 'pdf': {
        // Prepare columns for PDF
        const pdfColumns = props.columns
          ? props.columns.map((col) => ({
              header: typeof col === 'string' ? col : col.header || col.key,
              key: typeof col === 'string' ? col : col.key,
            }))
          : Object.keys(props.data[0] || {}).map((key) => ({
              header: key,
              key,
            }))

        exportToPDF(props.title, props.data, pdfColumns)
        break
      }
    }

    emit('export-complete', format)
  } catch (error) {
    console.error('Export error:', error)
    emit('export-error', { format, error })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.export-button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.export-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #999;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.export-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-button svg {
  flex-shrink: 0;
}

.export-button.csv {
  border-color: #28a745;
  color: #28a745;
}

.export-button.csv:hover:not(:disabled) {
  background: #28a74510;
  border-color: #28a745;
}

.export-button.excel {
  border-color: #217346;
  color: #217346;
}

.export-button.excel:hover:not(:disabled) {
  background: #21734610;
  border-color: #217346;
}

.export-button.pdf {
  border-color: #dc3545;
  color: #dc3545;
}

.export-button.pdf:hover:not(:disabled) {
  background: #dc354510;
  border-color: #dc3545;
}

/* Mobile responsive */
@media (max-width: 767px) {
  .export-button {
    font-size: 0.75rem;
    padding: 0.4rem 0.75rem;
  }

  .export-button span {
    display: none;
  }

  .export-button svg {
    width: 20px;
    height: 20px;
  }
}
</style>
