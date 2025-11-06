import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'

export type ModeLabel = 'Light' | 'Dark'

function buildThemeIndex(theme: JsonLike) {
  const out: Record<string, { value: any }> = {}
  const visit = (node: any, prefix: string, mode: ModeLabel) => {
    if (!node || typeof node !== 'object') return
    if (Object.prototype.hasOwnProperty.call(node, '$value')) {
      out[`${mode}::${prefix}`] = { value: (node as any)['$value'] }
      return
    }
    Object.keys(node).forEach((k) => visit((node as any)[k], prefix ? `${prefix}/${k}` : k, mode))
  }
  const root: any = (theme as any)?.brand ? (theme as any).brand : theme
  if (root?.light?.palette) visit(root.light.palette, 'palette', 'Light')
  if (root?.dark?.palette) visit(root.dark.palette, 'palette', 'Dark')
  return out
}

export function buildPaletteVars(tokens: JsonLike, theme: JsonLike, mode: ModeLabel): Record<string, string> {
  const themeIndex = buildThemeIndex(theme)
  const tokenIndex = buildTokenIndex(tokens)
  const levels = ['900','800','700','600','500','400','300','200','100','050']
  const palettes = ['neutral','palette-1','palette-2','palette-3','palette-4']
  const vars: Record<string, string> = {}
  const resolveThemeRef = (ref: any): any => resolveBraceRef(ref, tokenIndex, (path) => {
    const entry = themeIndex[`${mode}::${path}`]
    return entry?.value
  })
  palettes.forEach((pk) => {
    levels.forEach((lvl) => {
      const onToneName = `palette/${pk}/${lvl}/on-tone`
      const hiName = `palette/${pk}/${lvl}/high-emphasis`
      const loName = `palette/${pk}/${lvl}/low-emphasis`
      const onTone = resolveThemeRef({ collection: 'Theme', name: onToneName })
      const hi = resolveThemeRef({ collection: 'Theme', name: hiName })
      const lo = resolveThemeRef({ collection: 'Theme', name: loName })
      if (typeof onTone === 'string') vars[`--palette-${pk}-${lvl}-on-tone`] = String(onTone)
      if (typeof hi === 'number' || typeof hi === 'string') vars[`--palette-${pk}-${lvl}-high-emphasis`] = String(hi)
      if (typeof lo === 'number' || typeof lo === 'string') vars[`--palette-${pk}-${lvl}-low-emphasis`] = String(lo)
    })
  })
  return vars
}


