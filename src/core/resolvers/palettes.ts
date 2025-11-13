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
        return Object.keys(lightPal).filter((k) => k !== 'core' && k !== 'core-colors')
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
  palettes.forEach((pk) => {
    // Get actual levels defined for this palette in the theme
    const paletteLevels = (() => {
      try {
        const root: any = (theme as any)?.brand ? (theme as any).brand : theme
        const palette: any = root?.[mode.toLowerCase()]?.palettes?.[pk]
        if (!palette) return []
        // Get all level keys (excluding $type, $value, etc.)
        // Include both 'primary' and 'default' - 'default' will be mapped to 'primary' for CSS vars
        return Object.keys(palette).filter((k) => /^\d+$/.test(k) || k === 'primary' || k === 'default')
      } catch {
        return []
      }
    })()
    
    // Use defined levels if available, otherwise fall back to standard levels
    const levelsToProcess = paletteLevels.length > 0 ? paletteLevels : levels
    
    levelsToProcess.forEach((lvl) => {
      // Map 'default' to 'primary' for CSS variable names (Brand.json uses 'default', CSS uses 'primary')
      const cssLevel = lvl === 'default' ? 'primary' : lvl
      const toneName = `palette/${pk}/${lvl}/color/tone`
      const onToneName = `palette/${pk}/${lvl}/on-tone`
      let toneRaw = themeIndex[`${mode}::${toneName}`]?.value
      
      // If 'default' level and no direct color.tone, check if default references another level
      if (lvl === 'default' && !toneRaw) {
        const defaultRef = themeIndex[`${mode}::palette/${pk}/default`]?.value
        if (defaultRef && typeof defaultRef === 'string' && defaultRef.startsWith('{') && defaultRef.endsWith('}')) {
          // Parse reference like {theme.light.palettes.palette-1.400}
          const inner = defaultRef.slice(1, -1).trim()
          const match = /^(?:theme|brand)\.(?:light|dark)\.palettes\.([a-z0-9\-]+)\.(\d+)$/i.exec(inner)
          if (match && match[1] === pk) {
            // default references another level in the same palette, use that level's color.tone
            const referencedLevel = match[2]
            toneRaw = themeIndex[`${mode}::palette/${pk}/${referencedLevel}/color/tone`]?.value
          }
        }
      }
      
      // Skip if no tone value is defined in theme
      if (!toneRaw) return
      
      const scope = `--brand-${mode.toLowerCase()}-palettes-${pk}-${cssLevel}`
      
      // Parse tone from JSON - simple brace reference parsing
      let toneVar: string | null = null
      if (typeof toneRaw === 'string' && toneRaw.startsWith('{') && toneRaw.endsWith('}')) {
        const inner = toneRaw.slice(1, -1).trim()
        const match = /^tokens\.color\.([a-z0-9_-]+)\.([0-9]{2,4}|000|050)$/i.exec(inner)
        if (match) {
          const family = match[1]
          const level = toLevelString(match[2])
          toneVar = `var(--recursica-tokens-color-${family}-${level})`
        }
      }
      
      // If parsing failed, try resolving the theme reference
      if (!toneVar) {
        const tone = resolveThemeRef({ collection: 'Theme', name: toneName })
        if (typeof tone === 'string' && tone.startsWith('var(')) {
          toneVar = tone
        }
      }
      
      // Only emit if we successfully resolved a tone
      if (toneVar) {
        vars[`${scope}-tone`] = toneVar
        
        // Map on-tone to core color reference (black/white)
        // If theme JSON specifies on-tone, use it; otherwise default to black
        // AA compliance will be handled reactively in Phase 3
        // For 'default' level, check if we need to use the referenced level's on-tone
        let onToneRaw = themeIndex[`${mode}::${onToneName}`]?.value
        if (lvl === 'default' && !onToneRaw) {
          const defaultRef = themeIndex[`${mode}::palette/${pk}/default`]?.value
          if (defaultRef && typeof defaultRef === 'string' && defaultRef.startsWith('{') && defaultRef.endsWith('}')) {
            const inner = defaultRef.slice(1, -1).trim()
            const match = /^(?:theme|brand)\.(?:light|dark)\.palettes\.([a-z0-9\-]+)\.(\d+)$/i.exec(inner)
            if (match && match[1] === pk) {
              const referencedLevel = match[2]
              onToneRaw = themeIndex[`${mode}::palette/${pk}/${referencedLevel}/color/on-tone`]?.value
            }
          }
        }
        let onToneVar: string
        
        if (typeof onToneRaw === 'string') {
          const s = onToneRaw.trim().toLowerCase()
          if (s === '#ffffff' || s === 'white' || s === '{brand.light.palettes.core-colors.white}' || s === '{brand.dark.palettes.core-colors.white}' || s === '{brand.light.palettes.core.white}' || s === '{brand.dark.palettes.core.white}') {
            onToneVar = `var(--recursica-brand-${modeLower}-palettes-core-white)`
          } else if (s === '#000000' || s === 'black' || s === '{brand.light.palettes.core-colors.black}' || s === '{brand.dark.palettes.core-colors.black}' || s === '{brand.light.palettes.core.black}' || s === '{brand.dark.palettes.core.black}') {
            onToneVar = `var(--recursica-brand-${modeLower}-palettes-core-black)`
          } else {
            // Try to resolve as theme reference
            const onTone = resolveThemeRef({ collection: 'Theme', name: onToneName })
            if (typeof onTone === 'string' && onTone.startsWith('var(')) {
              onToneVar = onTone
            } else {
              // Default to black if unknown
              onToneVar = `var(--recursica-brand-${modeLower}-palettes-core-black)`
            }
          }
        } else {
          // Default to black - AA compliance will update this reactively in Phase 3
          onToneVar = `var(--recursica-brand-${modeLower}-palettes-core-black)`
        }
        
        vars[`${scope}-on-tone`] = onToneVar
      }
      // Do not emit per-level palette emphasis vars; consumers should reference brand-level text emphasis tokens directly
    })
  })
  return vars
}


