/**
 * tokenOverrides.ts
 *
 * Thin event-dispatch layer for notifying components when token values change.
 * Previously used localStorage ('token-overrides') for persistence;
 * now all persistence is handled by the CSS delta system (rf:css-delta).
 *
 * Events
 * - Dispatches 'tokenOverridesChanged' with detail { name, value, all }
 *   on set; and { all, reset: true } when cleared
 */
import { clearCustomFonts } from '../type/fontUtils'

export type TokenOverrides = Record<string, number | string>

/** @deprecated — overrides are no longer persisted separately. Returns empty object. */
export function readOverrides(): TokenOverrides {
  return {}
}

/** @deprecated — overrides are now tracked by the CSS delta system. No-op. */
export function writeOverrides(_next: TokenOverrides) {
  // No-op: persistence handled by delta system
}

/** @deprecated — use updateToken() which tracks in the CSS delta automatically. Dispatches event only. */
export function setOverride(name: string, value: number | string) {
  try {
    window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { name, value, all: {} } }))
  } catch {}
}

export function clearOverrides(initialAll?: any) {
  try {
    // Clear custom fonts and their @font-face rules
    try {
      clearCustomFonts()
    } catch {}

    // Clear other ephemeral client-side state
    try { localStorage.removeItem('type-token-choices') } catch {}

    let payload: Record<string, any> = {}
    if (initialAll && typeof initialAll === 'object') {
      const maybeEntries = Object.values(initialAll as Record<string, any>)
      if (maybeEntries.length && typeof maybeEntries[0] === 'object' && 'name' in (maybeEntries[0] as any) && 'value' in (maybeEntries[0] as any)) {
        const map: Record<string, any> = {}
        for (const e of maybeEntries as any[]) {
          if (e && typeof e.name === 'string') map[e.name] = e.value
        }
        payload = map
      } else {
        payload = initialAll as any
      }
    }
    window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: payload, reset: true } }))
  } catch {}
}
