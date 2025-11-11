export type ThemeVars = Record<string, string>

export function extractCssVarsFromObject(obj: unknown): ThemeVars {
  const vars: ThemeVars = {}
  const visit = (value: unknown) => {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const entry of value) visit(entry)
      } else {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (k.startsWith('--') && (typeof v === 'string' || typeof v === 'number')) {
            vars[k] = String(v)
          } else {
            visit(v)
          }
        }
      }
    }
  }
  visit(obj)
  return vars
}

export function applyCssVars(theme: ThemeVars) {
  const root = document.documentElement
  const toPrefixed = (name: string): string => {
    if (!name || !name.startsWith('--')) return name
    return `--recursica-${name.slice(2)}`
  }
  for (const [key, value] of Object.entries(theme)) {
    const pref = toPrefixed(key)
    // Write ONLY the prefixed variable
    root.style.setProperty(pref, value)
    // Remove the legacy/unprefixed variable if present
    if (pref !== key) root.style.removeProperty(key)
  }
}

export function getCurrentCssVars(): ThemeVars {
  const root = document.documentElement
  const style = root.style
  const computed = getComputedStyle(root)
  const vars: ThemeVars = {}
  for (let i = 0; i < style.length; i += 1) {
    const prop = style[i]
    if (prop && prop.startsWith('--')) {
      vars[prop] = computed.getPropertyValue(prop).trim()
    }
  }
  return vars
}

export function downloadCurrentCssVars(filename = 'theme-variables.json') {
  const vars = getCurrentCssVars()
  const blob = new Blob([JSON.stringify(vars, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


