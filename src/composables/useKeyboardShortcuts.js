import { onMounted, onBeforeUnmount } from 'vue'

/**
 * Keyboard shortcuts composable
 * @param {Object} shortcuts - Map of key combinations to callbacks
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': () => openSearch(),
 *   'escape': () => closeModal(),
 *   'ctrl+s': (e) => { e.preventDefault(); save(); }
 * })
 */
export function useKeyboardShortcuts(shortcuts) {
  const handleKeydown = (event) => {
    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey

    // Build key combination string
    let combination = ''
    if (ctrl) combination += 'ctrl+'
    if (shift) combination += 'shift+'
    if (alt) combination += 'alt+'
    combination += key

    // Also check for just the key
    const handlers = [shortcuts[combination], shortcuts[key]]

    for (const handler of handlers) {
      if (handler && typeof handler === 'function') {
        handler(event)
        break
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return { handleKeydown }
}

/**
 * Check if key combination is pressed
 * @param {KeyboardEvent} event
 * @param {String} combination - e.g., 'ctrl+k', 'escape', 'shift+enter'
 * @returns {Boolean}
 */
export function isKeyCombination(event, combination) {
  const parts = combination.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const modifiers = parts.slice(0, -1)

  const keyMatch = event.key.toLowerCase() === key
  const ctrlMatch = modifiers.includes('ctrl')
    ? event.ctrlKey || event.metaKey
    : !event.ctrlKey && !event.metaKey
  const shiftMatch = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey
  const altMatch = modifiers.includes('alt') ? event.altKey : !event.altKey

  return keyMatch && ctrlMatch && shiftMatch && altMatch
}

/**
 * Prevent default shortcuts in input fields
 * @param {Event} event
 * @returns {Boolean} - True if should skip shortcut
 */
export function shouldSkipShortcut(event) {
  const target = event.target
  const tagName = target?.tagName?.toLowerCase()
  const isEditable = target?.isContentEditable

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isEditable ||
    target?.hasAttribute('contenteditable')
  )
}

/**
 * Global keyboard shortcuts with common patterns
 */
export function useGlobalShortcuts(handlers = {}) {
  const defaultHandlers = {
    // Search shortcut (Ctrl+K or Cmd+K)
    'ctrl+k': (e) => {
      if (shouldSkipShortcut(e)) return
      e.preventDefault()
      handlers.search?.()
    },
    // Close/Cancel shortcut (Escape)
    escape: (e) => {
      if (shouldSkipShortcut(e)) return
      handlers.close?.()
    },
    // Save shortcut (Ctrl+S or Cmd+S)
    'ctrl+s': (e) => {
      if (shouldSkipShortcut(e)) return
      e.preventDefault()
      handlers.save?.()
    },
    // New item shortcut (Ctrl+N or Cmd+N)
    'ctrl+n': (e) => {
      if (shouldSkipShortcut(e)) return
      e.preventDefault()
      handlers.new?.()
    },
    // Help shortcut (?)
    '?': (e) => {
      if (shouldSkipShortcut(e)) return
      e.preventDefault()
      handlers.help?.()
    },
  }

  // Merge with custom handlers
  const mergedHandlers = { ...defaultHandlers, ...handlers }

  return useKeyboardShortcuts(mergedHandlers)
}
