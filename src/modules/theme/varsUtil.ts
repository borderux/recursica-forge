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

/**
 * True for the theme-less form of a ui-kit component property, e.g.
 *   --recursica_ui-kit_components_button_..._background-color
 * as opposed to its themed source of truth
 *   --recursica_ui-kit_themes_light_components_button_..._background-color
 *
 * These must NOT be written as inline styles on :root. core/css/scopedCssEngine.ts already
 * defines every one of them inside [data-recursica-theme="light"] / ["dark"] blocks pointing at
 * the themed var (measured: 2898 names, 100% covered in both themes), and an inline style on
 * :root outranks those stylesheet rules. Writing the generic copy therefore pins the property
 * to whichever theme was applied last, with two visible consequences:
 *
 *   - switching light/dark does not change components that read the generic name;
 *   - editing a themed value updates the themed var but leaves the stale generic one, so the
 *     preview does not move — the "changing a prop does nothing" class of bug.
 *
 * :root is meant to carry only specific/full-path names; that is the invariant scopedCssEngine
 * documents. This keeps it that way.
 */
function isThemeScopedGenericName(name: string): boolean {
  const n = !name.startsWith('--') || name.startsWith('--recursica_') ? name : `--recursica_${name.slice(2)}`
  if (!n.startsWith('--recursica_ui-kit_components_')) return false
  return !/_themes_(light|dark)_/.test(n)
}

export function applyCssVars(theme: ThemeVars) {
  const root = document.documentElement
  const toPrefixed = (name: string): string => {
    if (!name || !name.startsWith('--')) return name
    // If it already has --recursica_ prefix, return as-is
    if (name.startsWith('--recursica_')) return name
    return `--recursica_${name.slice(2)}`
  }
  for (const [key, value] of Object.entries(theme)) {
    const pref = toPrefixed(key)
    if (isThemeScopedGenericName(pref)) {
      // Drop any copy an earlier build left behind so the theme-scoped alias can win.
      root.style.removeProperty(pref)
      if (pref !== key) root.style.removeProperty(key)
      continue
    }
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


