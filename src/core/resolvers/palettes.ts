import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'
import { pickAAOnTone } from '../../modules/theme/contrastUtil'

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
  // Support both singular "palette" and plural "palettes" in theme JSON.
  // Always index under "palette/*" to match resolver lookups.
  if (root?.light?.palette) visit(root.light.palette, 'palette', 'Light')
  if (root?.dark?.palette) visit(root.dark.palette, 'palette', 'Dark')
  if (root?.light?.palettes) visit(root.light.palettes, 'palette', 'Light')
  if (root?.dark?.palettes) visit(root.dark.palettes, 'palette', 'Dark')
  return out
}

export function buildPaletteVars(tokens: JsonLike, theme: JsonLike, mode: ModeLabel): Record<string, string> {
  const themeIndex = buildThemeIndex(theme)
  const tokenIndex = buildTokenIndex(tokens)
  const levels = ['900','800','700','600','500','400','300','200','100','050']
  // Derive palette keys from Brand JSON (exclude 'core'); do NOT synthesize extra palettes
  const palettes = (() => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const lightPal: any = root?.light?.palettes || {}
      return Object.keys(lightPal).filter((k) => k !== 'core')
    } catch {
      return []
    }
  })()
  const vars: Record<string, string> = {}
  const resolveThemeRef = (ref: any): any => resolveBraceRef(ref, tokenIndex, (path) => {
    const entry = themeIndex[`${mode}::${path}`]
    return entry?.value
  })
  const modeLower = mode.toLowerCase()
  // Read brand-level text emphasis from Brand JSON and emit brand vars
  try {
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    const textEmphasis: any = (mode === 'Light' ? root?.light?.['text-emphasis'] : root?.dark?.['text-emphasis']) || {}
    const getOpacityVar = (v: any): string => {
      // Extract $value if v is an object with $value property (e.g., { $type: "number", $value: "{tokens.opacity.smoky}" })
      const rawValue = (v && typeof v === 'object' && '$value' in v) ? v.$value : v
      // Try to extract token name from brace reference before resolving
      try {
        if (typeof rawValue === 'string') {
          const inner = rawValue.startsWith('{') && rawValue.endsWith('}') ? rawValue.slice(1, -1) : rawValue
          const m = /^(?:tokens|token)\.opacity\.([a-z0-9\-_]+)$/i.exec(inner)
          if (m) return `var(--recursica-tokens-opacity-${m[1]})`
        }
      } catch {}
      // If that didn't work, try resolving and checking the result
      const s = resolveBraceRef(rawValue, tokenIndex)
      if (typeof s === 'string') {
        const m = /^(?:tokens|token)\/?opacity\/([a-z0-9\-_]+)$/i.exec(s)
        if (m) return `var(--recursica-tokens-opacity-${m[1]})`
        // numeric fallback wraps solid as default
        const n = Number(s)
        if (Number.isFinite(n)) {
          const norm = n <= 1 ? n : n / 100
          return `var(--recursica-tokens-opacity-solid, ${String(Math.max(0, Math.min(1, norm)))})`
        }
      }
      return 'var(--recursica-tokens-opacity-solid)'
    }
    const high = getOpacityVar(textEmphasis?.high)
    const low = getOpacityVar(textEmphasis?.low)
    vars[`--brand-${modeLower}-text-emphasis-high`] = high
    vars[`--brand-${modeLower}-text-emphasis-low`] = low
  } catch {}
  const toLevelString = (lvl: string): string => {
    const s = String(lvl).padStart(3, '0')
    if (s === '000') return '050'
    if (s === '1000') return '900'
    return s
  }
  const mapPaletteToTokenFamily: Record<string, string> = {
    neutral: 'gray',
    'palette-1': 'salmon',
    'palette-2': 'mandarin',
    'palette-3': 'cornflower',
    'palette-4': 'greensheen',
  }
  const findTokenByHex = (hex?: string): { family: string; level: string } | null => {
    try {
      const h = (hex || '').trim().toLowerCase()
      if (!/^#?[0-9a-f]{6}$/.test(h)) return null
      const normalized = h.startsWith('#') ? h : `#${h}`
      const families = Object.keys((tokens as any)?.tokens?.color || {})
      for (const fam of families) {
        if (fam === 'translucent') continue
        for (const lvl of levels) {
          const v = tokenIndex.get(`color/${fam}/${lvl}`)
          if (typeof v === 'string' && v.trim().toLowerCase() === normalized) {
            return { family: fam, level: lvl }
          }
        }
      }
    } catch {}
    return null
  }
  palettes.forEach((pk) => {
    levels.forEach((lvl) => {
      const toneName = `palette/${pk}/${lvl}/color/tone`
      const onToneName = `palette/${pk}/${lvl}/on-tone`
      const toneRaw = themeIndex[`${mode}::${toneName}`]?.value
      const tone = resolveThemeRef({ collection: 'Theme', name: toneName })
      const onTone = resolveThemeRef({ collection: 'Theme', name: onToneName })
      // Prefer referencing token CSS vars when palette tone maps to tokens
      const scope = `--brand-${mode.toLowerCase()}-palettes-${pk}-${lvl}`
      const tokenFamily = mapPaletteToTokenFamily[pk]
      const tokenLevel = toLevelString(String(lvl))
      const tokenHexFromFamily = (() => {
        try {
          if (!tokenFamily) return undefined
          const val = tokenIndex.get(`color/${tokenFamily}/${tokenLevel}`)
          return typeof val === 'string' ? val : undefined
        } catch { return undefined }
      })()
      const tokenRefFromRaw = (() => {
        try {
          const s = typeof toneRaw === 'string' ? toneRaw : ''
          if (!s || s[0] !== '{' || s[s.length - 1] !== '}') return null
          const inner = s.slice(1, -1)
          const m = /^tokens\.color\.([a-z0-9_-]+)\.([0-9]{2,4}|000|050)$/i.exec(inner)
          if (!m) return null
          const fam = m[1]
          const lvl2 = toLevelString(m[2])
          return `var(--recursica-tokens-color-${fam}-${lvl2})`
        } catch { return null }
      })()
      const tokenRefFromMap = tokenFamily ? `var(--recursica-tokens-color-${tokenFamily}-${tokenLevel})` : null
      // Always define tone: prefer token-based refs; avoid hex when possible
      if (tokenRefFromRaw != null) {
        vars[`${scope}-tone`] = tokenRefFromRaw
      } else if (tokenRefFromMap != null) {
        vars[`${scope}-tone`] = tokenRefFromMap
      } else {
        const fromHex = (() => {
          const h = typeof tone === 'string' ? String(tone).trim() : undefined
          const found = findTokenByHex(h)
          return found ? `var(--recursica-tokens-color-${found.family}-${found.level})` : undefined
        })()
        if (fromHex) {
          vars[`${scope}-tone`] = fromHex
        } else if (typeof tone === 'string') {
          vars[`${scope}-tone`] = String(tone)
        }
      }
      // Always map on-tone to core color reference (black/white), never hardcode hex
      {
        const toneHex = (() => {
          // Prefer tone hex from tokens mapping or theme tone
          if (tokenHexFromFamily && typeof tokenHexFromFamily === 'string') return tokenHexFromFamily
          if (typeof tone === 'string' && /^#?[0-9a-fA-F]{6}$/.test(String(tone).trim())) {
            const s = String(tone).trim()
            return s.startsWith('#') ? s : `#${s}`
          }
          return undefined
        })()
        const chosen = (() => {
          // If theme provided onTone explicitly as string, normalize to core var when it equals black/white
          if (typeof onTone === 'string') {
            const s = String(onTone).trim().toLowerCase()
            if (s === '#ffffff' || s === 'white') return 'white'
            if (s === '#000000' || s === 'black') return 'black'
          }
          // Else compute AA against toneHex
          if (typeof toneHex === 'string') {
        const aa = pickAAOnTone(toneHex).toLowerCase()
            return aa === '#ffffff' ? 'white' : 'black'
          }
          // Default to black if unknown
          return 'black'
        })()
        vars[`${scope}-on-tone`] = chosen === 'white'
          ? `var(--recursica-brand-${modeLower}-palettes-core-white)`
          : `var(--recursica-brand-${modeLower}-palettes-core-black)`
      }
      // Do not emit per-level palette emphasis vars; consumers should reference brand-level text emphasis tokens directly
    })
  })
  return vars
}


