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
  // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
  const themes = root?.themes || root
  // Support both singular "palette" and plural "palettes" in theme JSON.
  // Always index under "palette/*" to match resolver lookups.
  if (themes?.light?.palette) visit(themes.light.palette, 'palette', 'Light')
  if (themes?.dark?.palette) visit(themes.dark.palette, 'palette', 'Dark')
  if (themes?.light?.palettes) visit(themes.light.palettes, 'palette', 'Light')
  if (themes?.dark?.palettes) visit(themes.dark.palettes, 'palette', 'Dark')
  return out
}

export function buildPaletteVars(tokens: JsonLike, theme: JsonLike, mode: ModeLabel): Record<string, string> {
  const themeIndex = buildThemeIndex(theme)
  const tokenIndex = buildTokenIndex(tokens)
  const levels = ['1000','900','800','700','600','500','400','300','200','100','050','000']
  // Derive palette keys from Brand JSON (exclude 'core'); do NOT synthesize extra palettes
  const palettes = (() => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const lightPal: any = themes?.light?.palettes || {}
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
  
  // Helper function to convert opacity values to CSS variable references
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
  
  // Read brand-level text emphasis from Brand JSON and emit brand vars
  try {
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = root?.themes || root
    const textEmphasis: any = (mode === 'Light' ? themes?.light?.['text-emphasis'] : themes?.dark?.['text-emphasis']) || {}
    const high = getOpacityVar(textEmphasis?.high)
    const low = getOpacityVar(textEmphasis?.low)
    vars[`--recursica-brand-${modeLower}-text-emphasis-high`] = high
    vars[`--recursica-brand-${modeLower}-text-emphasis-low`] = low
  } catch {}
  
  // Helper function to convert color values to CSS variable references
  const getColorVar = (v: any): string => {
    // Extract $value if v is an object with $value property
    const rawValue = (v && typeof v === 'object' && '$value' in v) ? v.$value : v
    if (typeof rawValue === 'string') {
      // Extract the inner reference (remove braces if present)
      const inner = rawValue.startsWith('{') && rawValue.endsWith('}') ? rawValue.slice(1, -1).trim() : rawValue
      
      // Core color reference: brand.themes.{mode}.palettes.core-colors.{color}
      // Extract the mode from the reference itself (may be different from current mode)
      const coreMatch = /^brand\.themes\.(light|dark)\.palettes\.core-colors\.([a-z]+)$/i.exec(inner)
      if (coreMatch) {
        const refMode = coreMatch[1].toLowerCase()
        const color = coreMatch[2].toLowerCase()
        return `var(--recursica-brand-${refMode}-palettes-core-${color})`
      }
      
      // Palette reference: brand.themes.{mode}.palettes.{palette}.{level}.color.{type}
      const paletteMatch = /^brand\.themes\.(light|dark)\.palettes\.([a-z0-9-]+)\.([a-z0-9]+)\.color\.(tone|on-tone)$/i.exec(inner)
      if (paletteMatch) {
        const [, refMode, paletteKey, level, type] = paletteMatch
        const cssLevel = level === 'default' ? 'primary' : level
        return `var(--recursica-brand-${refMode.toLowerCase()}-palettes-${paletteKey}-${cssLevel}-${type})`
      }
      
      // Short palette reference: brand.themes.{mode}.palettes.{palette}
      const shortPaletteMatch = /^brand\.themes\.(light|dark)\.palettes\.([a-z0-9-]+)$/i.exec(inner)
      if (shortPaletteMatch) {
        const [, refMode, paletteKey] = shortPaletteMatch
        return `var(--recursica-brand-${refMode.toLowerCase()}-palettes-${paletteKey}-primary-tone)`
      }
      
      // Try to resolve theme reference as fallback (e.g., {brand.themes.light.palettes.core-colors.white})
      const resolved = resolveThemeRef(rawValue)
      if (typeof resolved === 'string') {
        // If already a CSS var, return it
        if (/^\s*var\(--/.test(resolved)) return resolved.trim()
      }
    }
    // Fallback to black for current mode
    return `var(--recursica-brand-${modeLower}-palettes-core-black)`
  }

  // Read brand-level state from Brand JSON and emit brand vars
  try {
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = root?.themes || root
    const state: any = (mode === 'Light' ? themes?.light?.state : themes?.dark?.state) || {}
    const disabled = getOpacityVar(state?.disabled)
    const overlayOpacity = getOpacityVar(state?.overlay?.opacity)
    const overlayColor = getColorVar(state?.overlay?.color)
    vars[`--recursica-brand-${modeLower}-state-disabled`] = disabled
    vars[`--recursica-brand-${modeLower}-state-overlay-opacity`] = overlayOpacity
    vars[`--recursica-brand-${modeLower}-state-overlay-color`] = overlayColor
  } catch {}
  const toLevelString = (lvl: string): string => {
    // Use token level as-is - no normalization needed
    // Token levels like 000, 050, 100-900, 1000 should be used directly
    return String(lvl)
  }
  palettes.forEach((pk) => {
    // Get actual levels defined for this palette in the theme
    const paletteLevels = (() => {
      try {
        const root: any = (theme as any)?.brand ? (theme as any).brand : theme
        // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
        const themes = root?.themes || root
        const palette: any = themes?.[mode.toLowerCase()]?.palettes?.[pk]
        if (!palette) return []
        // Get all level keys (excluding $type, $value, etc.)
        // Include both 'primary' and 'default' - 'default' will be mapped to 'primary' for CSS vars
        return Object.keys(palette).filter((k) => /^\d+$/.test(k) || k === 'primary' || k === 'default')
      } catch {
        return []
      }
    })()
    
    // Always use standard levels to ensure all levels (including 050) are processed
    // This ensures CSS vars are created for all standard levels even if JSON doesn't define them
    // We'll still check JSON for tone/on-tone values, but create CSS vars for all levels
    const levelsToProcess = levels
    
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
      
      const scope = `--recursica-brand-${mode.toLowerCase()}-palettes-${pk}-${cssLevel}`
      
      // Parse tone from JSON - simple brace reference parsing
      let toneVar: string | null = null
      if (toneRaw && typeof toneRaw === 'string' && toneRaw.startsWith('{') && toneRaw.endsWith('}')) {
        const inner = toneRaw.slice(1, -1).trim()
        // Match token references like tokens.color.{family}.{level}
        // Handle levels: 000, 050, 100-900, 1000 (explicitly match these patterns)
        const match = /^tokens\.color\.([a-z0-9_-]+)\.(000|050|[1-9][0-9]{2}|1000)$/i.exec(inner)
        if (match) {
          const family = match[1]
          const tokenLevel = match[2] // Use the token level from the JSON, NOT the palette level
          const level = toLevelString(tokenLevel)
          toneVar = `var(--recursica-tokens-color-${family}-${level})`
        } else {
          // If regex didn't match, try resolving through token index to get the actual hex value
          // Then try to find the matching token
          try {
            const tokenPath = inner.replace(/^tokens\.color\./i, '').replace(/\./g, '/')
            const tokenValue = tokenIndex.get(`color/${tokenPath}`)
            if (tokenValue && typeof tokenValue === 'string') {
              // We have the hex value, but we need the token reference
              // Extract the level from the path
              const pathParts = tokenPath.split('/')
              if (pathParts.length >= 2) {
                const [family, level] = pathParts
                toneVar = `var(--recursica-tokens-color-${family}-${level})`
              }
            }
          } catch {}
        }
      }
      
      // If parsing failed, try resolving the theme reference (but this should rarely be needed)
      if (!toneVar && toneRaw) {
        const tone = resolveThemeRef({ collection: 'Theme', name: toneName })
        if (typeof tone === 'string' && tone.startsWith('var(')) {
          toneVar = tone
        }
      }
      
      // Emit tone if we successfully resolved it
      if (toneVar) {
        vars[`${scope}-tone`] = toneVar
      }
      
      // Always process on-tone, even if tone wasn't found (some levels might only have on-tone defined)
      {
        
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
          // Support both old format (brand.light.*) and new format (brand.themes.light.*)
          // Also support shortcuts like {brand.themes.light.palettes.black} → core-colors.black
          if (s === '#ffffff' || s === 'white' || 
              s === '{brand.light.palettes.core-colors.white}' || s === '{brand.dark.palettes.core-colors.white}' ||
              s === '{brand.themes.light.palettes.core-colors.white}' || s === '{brand.themes.dark.palettes.core-colors.white}' ||
              s === '{brand.light.palettes.core.white}' || s === '{brand.dark.palettes.core.white}' ||
              s === '{brand.themes.light.palettes.white}' || s === '{brand.themes.dark.palettes.white}') {
            onToneVar = `var(--recursica-brand-${modeLower}-palettes-core-white)`
          } else if (s === '#000000' || s === 'black' || 
                     s === '{brand.light.palettes.core-colors.black}' || s === '{brand.dark.palettes.core-colors.black}' ||
                     s === '{brand.themes.light.palettes.core-colors.black}' || s === '{brand.themes.dark.palettes.core-colors.black}' ||
                     s === '{brand.light.palettes.core.black}' || s === '{brand.dark.palettes.core.black}' ||
                     s === '{brand.themes.light.palettes.black}' || s === '{brand.themes.dark.palettes.black}') {
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
    
    // After processing all levels, ensure primary-tone exists even if there's no 'default' level
    // This is needed because UIKit and other references use {palettes.neutral.default.color.tone}
    // which resolves to --recursica-brand-light-palettes-neutral-primary-tone
    const primaryToneVar = `--recursica-brand-${modeLower}-palettes-${pk}-primary-tone`
    const primaryOnToneVar = `--recursica-brand-${modeLower}-palettes-${pk}-primary-on-tone`
    
      if (!vars[primaryToneVar]) {
        // First, check if the CSS variable already exists in the DOM (user may have set it manually)
        // Import readCssVar at the top of the file if not already imported
        const existingPrimaryTone = typeof window !== 'undefined' ? (() => {
          try {
            const root = document.documentElement
            const inlineValue = root.style.getPropertyValue(primaryToneVar)
            if (inlineValue) return inlineValue.trim()
            const computedValue = getComputedStyle(root).getPropertyValue(primaryToneVar)
            if (computedValue) return computedValue.trim()
          } catch {}
          return null
        })() : null
        
        // If it exists in DOM and is a valid var() reference, use it
        if (existingPrimaryTone && existingPrimaryTone.startsWith('var(')) {
          vars[primaryToneVar] = existingPrimaryTone
          // Also check for on-tone
          const existingPrimaryOnTone = typeof window !== 'undefined' ? (() => {
            try {
              const root = document.documentElement
              const inlineValue = root.style.getPropertyValue(primaryOnToneVar)
              if (inlineValue) return inlineValue.trim()
              const computedValue = getComputedStyle(root).getPropertyValue(primaryOnToneVar)
              if (computedValue) return computedValue.trim()
            } catch {}
            return null
          })() : null
          if (existingPrimaryOnTone && existingPrimaryOnTone.startsWith('var(')) {
            vars[primaryOnToneVar] = existingPrimaryOnTone
          }
        } else {
          // Otherwise, check localStorage for user-selected primary level (mode-specific)
          let primaryLevel: string | null = null
          try {
            const raw = localStorage.getItem(`palette-primary-level:${pk}:${modeLower}`)
            if (raw) {
              const parsed = JSON.parse(raw)
              if (typeof parsed === 'string') {
                primaryLevel = parsed.padStart(3, '0')
              }
            }
          } catch {}
        
          // If no localStorage value, try to find a suitable fallback level (prefer 500, then 400, then 600, then first available)
          if (!primaryLevel) {
            const fallbackLevels = ['500', '400', '600', '300', '700', '200', '800', '100', '900', '050']
            for (const level of fallbackLevels) {
              const fallbackToneVar = `--recursica-brand-${modeLower}-palettes-${pk}-${level}-tone`
              if (vars[fallbackToneVar]) {
                primaryLevel = level
                break
              }
            }
          }
          
          // If we found a primary level (from localStorage or fallback), create primary-tone and primary-on-tone by referencing it
          if (primaryLevel) {
            const targetToneVar = `--recursica-brand-${modeLower}-palettes-${pk}-${primaryLevel}-tone`
            const targetOnToneVar = `--recursica-brand-${modeLower}-palettes-${pk}-${primaryLevel}-on-tone`
            if (vars[targetToneVar]) {
              vars[primaryToneVar] = `var(${targetToneVar})`
              if (vars[targetOnToneVar]) {
                vars[primaryOnToneVar] = `var(${targetOnToneVar})`
              }
            }
          }
        }
      }
  })
  return vars
}


