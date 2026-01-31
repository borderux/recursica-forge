/**
 * CSS Audit Preference Utility
 * 
 * Manages the preference for auto-running CSS audits in development mode.
 * Uses localStorage to persist the preference across sessions.
 */

const STORAGE_KEY = 'recursica-css-audit-auto-run'

/**
 * Get the current CSS audit auto-run preference
 * @returns true if audits should auto-run, false otherwise (defaults to false)
 */
export function getCssAuditAutoRun(): boolean {
  if (typeof window === 'undefined') return false
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === null) return false // Default to false
  
  return stored === 'true'
}

/**
 * Set the CSS audit auto-run preference
 * @param enabled - Whether audits should auto-run
 */
export function setCssAuditAutoRun(enabled: boolean): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
}
