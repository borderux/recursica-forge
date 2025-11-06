import { applyCssVars as applyDirect } from '../../modules/theme/varsUtil'

export type CssVarMap = Record<string, string>

export function applyCssVars(vars: CssVarMap) {
  applyDirect(vars)
}

export function applyCssVarsDelta(prev: CssVarMap | null, next: CssVarMap): { applied: number } {
  const root = document.documentElement
  let applied = 0
  const prevMap = prev || {}
  // Apply changed or added vars
  for (const [key, value] of Object.entries(next)) {
    if (prevMap[key] !== value) {
      root.style.setProperty(key, value)
      applied += 1
    }
  }
  // Optionally remove vars that disappeared. Skip removal for now to avoid stale flashes.
  return { applied }
}


