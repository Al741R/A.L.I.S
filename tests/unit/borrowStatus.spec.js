import { describe, it, expect } from 'vitest'
import { isOverdue, effectiveStatus } from '../../src/composables/borrowStatus'

function daysFromNow(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

describe('borrowStatus helpers', () => {
  it('detects non-overdue borrowed', () => {
    const tx = { status: 'Borrowed', due_date: daysFromNow(2) }
    expect(isOverdue(tx)).toBe(false)
    expect(effectiveStatus(tx)).toBe('Borrowed')
  })
  it('detects overdue borrowed (date-only)', () => {
    const tx = { status: 'Borrowed', due_date: daysFromNow(-1) }
    expect(isOverdue(tx)).toBe(true)
    expect(effectiveStatus(tx)).toBe('Overdue')
  })
  it('retains explicit Overdue status', () => {
    const tx = { status: 'Overdue', due_date: daysFromNow(-3) }
    expect(isOverdue(tx)).toBe(true)
    expect(effectiveStatus(tx)).toBe('Overdue')
  })
  it('ignores returned transactions', () => {
    const tx = { status: 'Returned', due_date: daysFromNow(-5) }
    expect(isOverdue(tx)).toBe(false)
    expect(effectiveStatus(tx)).toBe('Returned')
  })
  it('handles malformed dates gracefully', () => {
    const tx = { status: 'Borrowed', due_date: 'invalid-date' }
    expect(isOverdue(tx)).toBe(false)
    expect(effectiveStatus(tx)).toBe('Borrowed')
  })
})
