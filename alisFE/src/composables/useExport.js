/**
 * Export utilities for CSV and PDF generation
 * Handles data export for reports and tables
 *
 * @example CSV Export
 * const { exportToCSV } = useExport()
 * exportToCSV(books, 'books-report', ['title', 'author', 'isbn'])
 *
 * @example PDF Export (requires jsPDF installation)
 * const { exportToPDF } = useExport()
 * exportToPDF('Monthly Report', reportData, columns)
 */

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Optional: specific columns to export
 * @param {Object} options - Optional export options
 */
export function exportToCSV(data, filename = 'export', columns = null, options = {}) {
  const { delimiter = ',', includeHeaders = true, dateFormat = 'YYYY-MM-DD' } = options

  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Determine columns
  const headers = columns || Object.keys(data[0])

  // Build CSV content
  let csvContent = ''

  // Add headers
  if (includeHeaders) {
    csvContent += headers.map((h) => escapeCSV(h)).join(delimiter) + '\n'
  }

  // Add rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header]

      // Format dates
      if (value instanceof Date) {
        return formatDate(value, dateFormat)
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }

      // Handle objects/arrays
      if (typeof value === 'object') {
        return escapeCSV(JSON.stringify(value))
      }

      return escapeCSV(String(value))
    })

    csvContent += values.join(delimiter) + '\n'
  })

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `${filename}.csv`)
}

/**
 * Export data to PDF (requires jsPDF library)
 * Note: For full functionality, install jspdf: npm install jspdf
 *
 * @param {string} title - PDF document title
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions { header: 'Name', key: 'name', width: 100 }
 * @param {Object} options - PDF generation options
 */
export function exportToPDF(title, data, columns, options = {}) {
  const { orientation = 'portrait', format = 'a4', includeDate = true, fontSize = 10 } = options

  try {
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
      console.warn('jsPDF library not found. Using fallback text export.')
      exportToPDFFallback(title, data, columns)
      return
    }

    const { jsPDF } = window.jspdf

    // Create new PDF document
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    })

    // Add title
    doc.setFontSize(16)
    doc.text(title, 14, 20)

    // Add date if requested
    if (includeDate) {
      doc.setFontSize(10)
      const dateStr = new Date().toLocaleDateString()
      doc.text(`Generated: ${dateStr}`, 14, 28)
    }

    // Add table
    const startY = includeDate ? 35 : 28

    doc.setFontSize(fontSize)

    // Prepare table data
    const headers = columns.map((col) => col.header || col.key)
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key]
        return formatPDFValue(value)
      }),
    )

    // Use autoTable if available (jspdf-autotable plugin)
    if (doc.autoTable) {
      doc.autoTable({
        head: [headers],
        body: rows,
        startY,
        styles: { fontSize },
      })
    } else {
      // Simple table fallback
      drawSimpleTable(doc, headers, rows, startY)
    }

    // Save PDF
    doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  } catch (error) {
    console.error('PDF export error:', error)
    exportToPDFFallback(title, data, columns)
  }
}

/**
 * Fallback PDF export using plain text format
 */
function exportToPDFFallback(title, data, columns) {
  let content = `${title}\n`
  content += `Generated: ${new Date().toLocaleString()}\n`
  content += '='.repeat(80) + '\n\n'

  // Add headers
  const headers = columns.map((col) => col.header || col.key)
  content += headers.join('\t') + '\n'
  content += '-'.repeat(80) + '\n'

  // Add rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      const value = row[col.key]
      return formatPDFValue(value)
    })
    content += values.join('\t') + '\n'
  })

  // Create blob and trigger download
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  downloadFile(blob, `${title.replace(/\s+/g, '-').toLowerCase()}.txt`)
}

/**
 * Draw a simple table in PDF
 */
function drawSimpleTable(doc, headers, rows, startY) {
  const rowHeight = 7
  const colWidth = 40

  let y = startY

  // Draw headers
  doc.setFont(undefined, 'bold')
  headers.forEach((header, i) => {
    doc.text(String(header), 14 + i * colWidth, y)
  })
  y += rowHeight

  // Draw rows
  doc.setFont(undefined, 'normal')
  rows.forEach((row) => {
    row.forEach((cell, i) => {
      const text = String(cell).substring(0, 20) // Truncate long text
      doc.text(text, 14 + i * colWidth, y)
    })
    y += rowHeight

    // Add new page if needed
    if (y > 280) {
      doc.addPage()
      y = 20
    }
  })
}

/**
 * Export table element to CSV
 * @param {HTMLTableElement} tableElement - HTML table to export
 * @param {string} filename - Output filename
 */
export function exportTableToCSV(tableElement, filename = 'table-export') {
  const rows = []

  // Extract headers
  const headerCells = tableElement.querySelectorAll('thead th, thead td')
  if (headerCells.length > 0) {
    rows.push(Array.from(headerCells).map((cell) => cell.textContent.trim()))
  }

  // Extract body rows
  const bodyRows = tableElement.querySelectorAll('tbody tr')
  bodyRows.forEach((row) => {
    const cells = row.querySelectorAll('td, th')
    rows.push(Array.from(cells).map((cell) => cell.textContent.trim()))
  })

  // Convert to CSV
  const csvContent = rows.map((row) => row.map((cell) => escapeCSV(cell)).join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `${filename}.csv`)
}

/**
 * Export data to Excel format (CSV with Excel-friendly BOM)
 * @param {Array} data - Data to export
 * @param {string} filename - Output filename
 * @param {Array} columns - Optional columns
 */
export function exportToExcel(data, filename = 'export', columns = null) {
  const csvContent = generateCSVContent(data, columns)

  // Add BOM for Excel UTF-8 recognition
  const BOM = '\ufeff'
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  downloadFile(blob, `${filename}.csv`)
}

/**
 * Generate CSV content from data
 */
function generateCSVContent(data, columns = null) {
  if (!data || data.length === 0) return ''

  const headers = columns || Object.keys(data[0])
  let content = headers.map((h) => escapeCSV(h)).join(',') + '\n'

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header]
      return escapeCSV(String(value ?? ''))
    })
    content += values.join(',') + '\n'
  })

  return content
}

// --- Helper Functions ---

/**
 * Escape CSV values
 */
function escapeCSV(value) {
  if (typeof value !== 'string') {
    value = String(value)
  }

  // Escape quotes and wrap in quotes if contains special chars
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

/**
 * Format date for export
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return format.replace('YYYY', year).replace('MM', month).replace('DD', day)
}

/**
 * Format value for PDF
 */
function formatPDFValue(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Trigger file download
 */
function downloadFile(blob, filename) {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Main export composable
 */
export function useExport() {
  return {
    exportToCSV,
    exportToPDF,
    exportTableToCSV,
    exportToExcel,
  }
}
