/**
 * tokenOverrides.ts
 *
 * Small utility for reading/writing token overrides to localStorage and
 * notifying the app when values change.
 *
 * Storage
 * - Key: 'token-overrides' (JSON object of name -> value)
 *
 * Events
 * - Dispatches 'tokenOverridesChanged' with detail { name, value, all }
 *   on set; and { all, reset: true } when cleared
 */
import { clearCustomFonts } from '../type/fontUtils'

const STORAGE_KEY = 'token-overrides'

export type TokenOverrides = Record<string, number | string>

export function readOverrides(): TokenOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as TokenOverrides
  } catch {}
  return {}
}

export function writeOverrides(next: TokenOverrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {}
}

export function setOverride(name: string, value: number | string) {
  const current = readOverrides()
  const updated = { ...current, [name]: value }
  writeOverrides(updated)
  try {
    window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { name, value, all: updated } }))
  } catch {}
}

export function clearOverrides(initialAll?: any) {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
  try {
    // Clear custom fonts and their @font-face rules
    try {
      clearCustomFonts()
    } catch {}
    
    // Clear other ephemeral client-side state
    const removeKeys = (
      Object.keys(localStorage || {}) as Array<string>
    ).filter((k) => (
      // keep 'family-friendly-names' intact; it is sourced from Tokens.json
      k === 'font-families-deleted' ||
      k === 'effects-scale-by-default' ||
      k === 'font-letter-scale-by-tight-wide' ||
      k === 'palette-opacity-bindings' ||
      k === 'dynamic-palettes' ||
      k === 'type-token-choices' ||
      k.startsWith('palette-grid-family:')
    ))
    removeKeys.forEach((k) => {
      try { localStorage.removeItem(k) } catch {}
    })

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


