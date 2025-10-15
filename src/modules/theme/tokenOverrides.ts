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

export function clearOverrides(initialAll?: TokenOverrides) {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: initialAll || {} } }))
  } catch {}
}


