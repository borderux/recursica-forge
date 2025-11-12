import { applyCssVars as applyDirect } from '../../modules/theme/varsUtil'

export type CssVarMap = Record<string, string>

export function applyCssVars(vars: CssVarMap) {
  applyDirect(vars)
}

export function clearAllCssVars() {
  const root = document.documentElement
  const style = root.style
  const varsToRemove: string[] = []
  
  // Collect all --recursica-* CSS custom properties from inline styles
  for (let i = 0; i < style.length; i++) {
    const prop = style[i]
    if (prop && prop.startsWith('--recursica-')) {
      varsToRemove.push(prop)
    }
  }
  
  // Remove them
  varsToRemove.forEach(prop => root.style.removeProperty(prop))
}

export function applyCssVarsDelta(prev: CssVarMap | null, next: CssVarMap): { applied: number } {
  const root = document.documentElement
  let applied = 0
  const prevMap = prev || {}
  const toPrefixed = (name: string): string => {
    if (!name || !name.startsWith('--')) return name
    return `--recursica-${name.slice(2)}`
  }
  // Apply changed or added vars
  for (const [key, value] of Object.entries(next)) {
    const pref = toPrefixed(key)
    // Write ONLY the prefixed variable
    root.style.setProperty(pref, value)
    // Ensure the old/unprefixed variable is removed
    if (pref !== key) root.style.removeProperty(key)
    applied += 1
  }
  // Remove any old variables (both prefixed and unprefixed) that were previously applied but are no longer present
  const nextKeys = new Set(Object.keys(next))
  for (const key of Object.keys(prevMap)) {
    if (!key.startsWith('--')) continue
    const pref = toPrefixed(key)
    // Remove unprefixed legacy var if it exists
    if (pref !== key) {
      root.style.removeProperty(key)
    }
    // Remove prefixed var if it's no longer in next map
    if (!nextKeys.has(key)) {
      root.style.removeProperty(pref)
    }
  }
  return { applied }
}


