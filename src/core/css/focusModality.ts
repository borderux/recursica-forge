/**
 * Focus modality tracker.
 *
 * The global focus glow uses :focus-visible, which the browser already keeps off
 * for pointer clicks on buttons/checkboxes/etc. But for text-like inputs Chrome
 * marks :focus-visible on *click* too (to show the caret context), which would
 * light the field's glow on click. We only want the glow on keyboard focus
 * ("Tab to focus"), so we mark <html data-recursica-kbd> only while the user is
 * navigating with the keyboard, and gate the input-field glow on that attribute.
 */

const NAV_KEYS = new Set([
  'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End',
])

export function initFocusModality() {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  const set = (on: boolean) => {
    if (on) root.setAttribute('data-recursica-kbd', '')
    else root.removeAttribute('data-recursica-kbd')
  }
  // Keyboard navigation enables the glow; pointer interaction disables it.
  window.addEventListener('keydown', (e) => { if (NAV_KEYS.has(e.key)) set(true) }, true)
  window.addEventListener('pointerdown', () => set(false), true)
  window.addEventListener('mousedown', () => set(false), true)
  window.addEventListener('touchstart', () => set(false), true)
}
