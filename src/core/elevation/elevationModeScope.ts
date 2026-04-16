/**
 * Elevation Color Mirror
 *
 * Persists whether elevation shadow-color changes should be mirrored
 * across both light and dark modes simultaneously (locked) or applied
 * to the current theme mode only (unlocked).
 *
 * Default: unlocked (changes apply to current mode only).
 */

const KEY = 'rf:elevation-color-mirror'

export function getElevationColorMirror(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch { /* noop */ }
  return false
}

export function setElevationColorMirror(mirrored: boolean): void {
  try {
    if (mirrored) {
      localStorage.setItem(KEY, 'true')
    } else {
      localStorage.removeItem(KEY)
    }
  } catch { /* noop */ }
}

export function clearElevationColorMirror(): void {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}
