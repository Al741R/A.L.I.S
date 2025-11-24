// Helper functions for borrowed / overdue status classification.
export function isOverdue(transaction) {
  if (!transaction?.due_date || transaction.status === 'Returned') return false
  let due
  const dueRaw = transaction.due_date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueRaw)) {
    const [y, m, d] = dueRaw.split('-').map(Number)
    due = new Date(y, m - 1, d, 23, 59, 59, 999)
  } else {
    due = new Date(dueRaw)
  }
  if (isNaN(due.getTime())) return false
  return Date.now() > due.getTime()
}

export function effectiveStatus(transaction) {
  if (!transaction) return undefined
  if (transaction.status === 'Borrowed' && isOverdue(transaction)) return 'Overdue'
  return transaction.status
}
