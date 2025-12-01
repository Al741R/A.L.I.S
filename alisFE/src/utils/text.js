// Central text/description utilities.
// Keep functions tiny and deterministic; no side effects.

export function truncateDescription(txt) {
  if (!txt) return ''
  return txt.length <= 160 ? txt : txt.slice(0, 157) + '…'
}

export function truncateAdminDescription(txt) {
  if (!txt) return ''
  return txt.length <= 70 ? txt : txt.slice(0, 67) + '…'
}

export function truncateText(txt, max = 140) {
  if (!txt) return ''
  return txt.length <= max ? txt : txt.slice(0, max - 1) + '…'
}

export function sanitizeDescription(desc) {
  if (!desc) return ''
  // Trim excessive whitespace and cap length to 1200 (UI constraint)
  const trimmed = desc.trim()
  if (trimmed.length > 1200) return trimmed.slice(0, 1200)
  return trimmed
}
