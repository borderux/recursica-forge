/**
 * Global Keyboard Focus Helper
 * 
 * Sets up a global listener for keyboard events to handle:
 * 1. Escape key blurring any currently focused element.
 */

export function initKeyboardFocusHelper() {
  if (typeof window === 'undefined') return

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement !== document.body) {
        // Blur the focused element
        activeElement.blur()
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}
