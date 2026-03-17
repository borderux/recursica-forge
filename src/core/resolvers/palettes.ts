import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'
import { resolveTokenReferenceToCssVar, resolveTokenReferenceToValue, extractBraceContent, parseTokenReference, type TokenReferenceContext } from '../utils/tokenReferenceParser'
import { readCssVar } from '../css/readCssVar'
import { textEmphasis as textEmphasisVar, state as stateVar, paletteCore, palette as paletteVar, tokenOpacity } from '../css/cssVarBuilder'



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
  const levels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']
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

  // Create context for centralized token reference parser
  const context: TokenReferenceContext = {
    currentMode: mode.toLowerCase() as 'light' | 'dark',
    tokenIndex,
    theme
  }

  // Helper function to convert opacity values to CSS variable references
  const getOpacityVar = (v: any): string => {
    // Extract $value if v is an object with $value property (e.g., { $type: "number", $value: "{tokens.opacity.smoky}" })
    const rawValue = (v && typeof v === 'object' && '$value' in v) ? v.$value : v
    // Try to resolve using centralized parser
    try {
      if (typeof rawValue === 'string') {
        const parsed = parseTokenReference(rawValue, context)
        if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && (parsed.path[0] === 'opacity' || parsed.path[0] === 'opacities')) {
          const tokenName = parsed.path[1]
          // Standardize on plural 'opacities' to match tokenRefs.ts and varsStore mapping
          return `var(${tokenOpacity(tokenName)})`
        }
      }
    } catch { }
    // If that didn't work, try resolving and checking the result
    const s = resolveBraceRef(rawValue, tokenIndex)
    if (s != null) {
      const sStr = String(s)
      // Try centralized parser on the resolved value
      const parsed = parseTokenReference(sStr, context)
      if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && (parsed.path[0] === 'opacity' || parsed.path[0] === 'opacities')) {
        return `var(${tokenOpacity(parsed.path[1])})`
      }
      // numeric fallback: if we resolved to a number, use it directly
      const n = Number(sStr)
      if (Number.isFinite(n)) {
        const norm = n <= 1 ? n : n / 100
        const normStr = String(Math.max(0, Math.min(1, norm)))
        // Return the number itself as the primary value, with 'solid' as a fallback variable ONLY if the number is 1
        if (norm >= 0.99) return `var(${tokenOpacity('solid')}, 1)`
        return normStr
      }
    }
    return `var(${tokenOpacity('solid')})`
  }

  // Read brand-level text emphasis from Brand JSON and emit brand vars
  try {
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = root?.themes || root
    const textEmphasis: any = (mode === 'Light' ? themes?.light?.['text-emphasis'] : themes?.dark?.['text-emphasis']) || {}
    const high = getOpacityVar(textEmphasis?.high)
    const low = getOpacityVar(textEmphasis?.low)
    vars[textEmphasisVar(modeLower, 'high')] = high
    vars[textEmphasisVar(modeLower, 'low')] = low
  } catch { }

  // Helper function to convert color values to CSS variable references
  const getColorVar = (v: any, depth: number = 0): string => {
    // Prevent infinite recursion
    if (depth > 5) {
      return `var(${paletteCore(modeLower, 'black')})`
    }

    // Extract $value if v is an object with $value property
    const rawValue = (v && typeof v === 'object' && '$value' in v) ? v.$value : v

    // Try to resolve to CSS var using centralized parser
    const cssVar = resolveTokenReferenceToCssVar(rawValue, context)
    if (cssVar) {
      // Special handling for shortcuts like {brand.palettes.black} or {brand.palettes.white}
      // These should resolve to the actual tone value, not create circular references
      const parsed = parseTokenReference(rawValue, context)
      if (parsed && parsed.type === 'brand') {
        const pathParts = parsed.path
        // Check if it's a core color shortcut: palettes.core-colors.{color} or palettes.{color}
        if (pathParts.length >= 2 && pathParts[0] === 'palettes') {
          let color: string | undefined
          let refMode = parsed.mode || modeLower
          if (pathParts.length >= 3 && (pathParts[1] === 'core-colors' || pathParts[1] === 'core')) {
            color = pathParts[2]
          } else if (pathParts.length === 2 && (pathParts[1] === 'black' || pathParts[1] === 'white')) {
            color = pathParts[1]
          }
          if (color && ['black', 'white'].includes(color.toLowerCase())) {
            // Resolve to the actual tone value from core-colors, not to the CSS var itself
            try {
              const root: any = (theme as any)?.brand ? (theme as any).brand : theme
              const themes = root?.themes || root
              const coreColorsRaw: any = (refMode === 'light' ? themes?.light?.palettes?.['core-colors'] : themes?.dark?.palettes?.['core-colors']) || {}
              const coreColors: any = coreColorsRaw?.$value || coreColorsRaw
              const colorDef: any = coreColors?.[color]
              if (colorDef?.tone) {
                // Recursively resolve the tone value (should be a token reference)
                return getColorVar(colorDef.tone, depth + 1)
              }
            } catch { }
            // Fallback to CSS var if resolution fails
            return `var(${paletteCore(refMode, color)})`
          }
        }
      }
      return cssVar
    }

    // Try to resolve theme reference as fallback
    if (typeof rawValue === 'string') {
      const resolved = resolveThemeRef(rawValue)
      if (typeof resolved === 'string') {
        // If already a CSS var, return it
        if (/^\s*var\(--/.test(resolved)) return resolved.trim()
        // If resolved to a string that's not a CSS var, try to resolve it further
        if (typeof resolved === 'string' && resolved.startsWith('{') && resolved.endsWith('}')) {
          return getColorVar(resolved, depth + 1)
        }
      }
    }

    // Fallback to black for current mode
    return `var(${paletteCore(modeLower, 'black')})`
  }

  // Read brand-level state from Brand JSON and emit brand vars
  try {
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = root?.themes || root
    const state: any = (mode === 'Light' ? themes?.light?.states : themes?.dark?.states) || {}
    const disabled = getOpacityVar(state?.disabled)
    const hover = getOpacityVar(state?.hover)
    const overlayOpacity = getOpacityVar(state?.overlay?.opacity)
    const overlayColor = getColorVar(state?.overlay?.color)

    // Always emit state CSS variables, even if values are undefined (they'll have fallback defaults)
    vars[stateVar(modeLower, 'disabled')] = disabled
    vars[stateVar(modeLower, 'hover')] = hover
    vars[stateVar(modeLower, 'overlay', 'opacity')] = overlayOpacity
    vars[stateVar(modeLower, 'overlay', 'color')] = overlayColor
  } catch (err) {
    // If state vars fail to generate, provide fallback defaults
    console.error('[PaletteResolver] Failed to generate state variables:', err)
    vars[stateVar(modeLower, 'disabled')] = `var(${tokenOpacity('solid')})`
    vars[stateVar(modeLower, 'hover')] = `var(${tokenOpacity('solid')})`
    vars[stateVar(modeLower, 'overlay', 'opacity')] = `var(${tokenOpacity('solid')})`
    vars[stateVar(modeLower, 'overlay', 'color')] = `var(${paletteCore(modeLower, 'black')})`
  }
  const toLevelString = (lvl: string): string => {
    // Normalize token level to match CSS variable format
    // Token levels should be padded to 3 digits (e.g., 50 -> 050, 5 -> 005)
    // But preserve special levels like 000, 050, 1000 as-is
    const num = Number(lvl)
    if (Number.isFinite(num) && num >= 0 && num <= 1000) {
      // Pad to 3 digits, but handle special cases
      if (num === 0) return '000'
      if (num === 50) return '050'
      if (num === 1000) return '1000'
      return String(num).padStart(3, '0')
    }
    // For non-numeric levels, return as-is
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

    // Always process all standard levels (including 1000) to ensure CSS variables are generated
    // Even if a level doesn't exist in JSON, we'll generate default values for on-tone
    // This ensures reset doesn't cause on-tone colors to disappear
    // Also include 'default' and 'primary' from paletteLevels if they exist
    const levelsToProcess = [...levels]
    if (paletteLevels.includes('default') && !levelsToProcess.includes('default')) {
      levelsToProcess.push('default')
    }
    if (paletteLevels.includes('primary') && !levelsToProcess.includes('primary')) {
      levelsToProcess.push('primary')
    }

    levelsToProcess.forEach((lvl) => {
      // Map 'default' to 'primary' for CSS variable names (recursica_brand.json uses 'default', CSS uses 'primary')
      const cssLevel = lvl === 'default' ? 'primary' : lvl
      const toneName = `palette/${pk}/${lvl}/color/tone`
      const onToneName = `palette/${pk}/${lvl}/color/on-tone`
      let toneRaw = themeIndex[`${mode}::${toneName}`]?.value

      // Check if on-tone exists in JSON
      // We always want to generate on-tone CSS variables, even if tone doesn't exist
      // So we don't skip the level - we'll generate a default on-tone value if needed
      const onToneRawCheck = themeIndex[`${mode}::${onToneName}`]?.value

      // NEVER skip standard levels (like 1000) - always generate CSS variables for them
      // Only skip non-standard levels that don't exist in JSON and aren't in the standard levels array
      const isStandardLevel = levels.includes(lvl) || lvl === 'default'
      if (!toneRaw && !onToneRawCheck && !isStandardLevel) {
        return // Skip non-standard levels that don't exist in JSON
      }

      // For standard levels (including 1000), always continue to generate CSS variables
      // even if they don't exist in JSON - they'll get default values

      // If 'default' level and no direct color.tone, check if default references another level
      if (lvl === 'default' && !toneRaw) {
        const defaultRef = themeIndex[`${mode}::palette/${pk}/default`]?.value
        if (defaultRef && typeof defaultRef === 'string') {
          const parsed = parseTokenReference(defaultRef, context)
          if (parsed && parsed.type === 'brand' && parsed.path.length >= 3) {
            // Check if it's a palette reference: palettes.{paletteKey}.{level}
            if (parsed.path[0] === 'palettes' && parsed.path[1] === pk && /^\d+$/.test(parsed.path[2])) {
              const referencedLevel = parsed.path[2]
              toneRaw = themeIndex[`${mode}::palette/${pk}/${referencedLevel}/color/tone`]?.value
            }
          }
        }
      }

      // Tone and on-tone CSS var names for this palette level
      const toneKey = paletteVar(modeLower, pk, cssLevel, 'color_tone')
      const onToneKey = paletteVar(modeLower, pk, cssLevel, 'color_on-tone')

      // Parse tone from JSON - use centralized resolver to handle both old and new formats
      let toneVar: string | null = null
      if (toneRaw && typeof toneRaw === 'string') {
        // Use resolveTokenReferenceToCssVar to handle both:
        // - Old format: {tokens.color.family.level} -> --recursica_tokens_color_{family}-{level}
        // - New format: {tokens.colors.scale-XX.level} -> --recursica_tokens_colors_{scale_XX}-{level}
        toneVar = resolveTokenReferenceToCssVar(toneRaw, context)

        // If that didn't work, try resolving to see if it's a valid reference that just resolved to a hex
        if (!toneVar) {
          try {
            const resolvedValue = resolveTokenReferenceToValue(toneRaw, context)
            if (resolvedValue && typeof resolvedValue === 'string' && resolvedValue.startsWith('#')) {
              // If it resolved to a hex color, we can't generate a CSS variable from it
              // This is a fallback case - the reference should be in token format
              console.error(`[PaletteResolver] Tone reference resolved to hex color instead of token: ${toneRaw} -> ${resolvedValue}`)
            }
          } catch { }
        }
      }

      // If parsing failed, try resolving the theme reference (but this should rarely be needed)
      if (!toneVar && toneRaw) {
        const tone = resolveThemeRef({ collection: 'Theme', name: toneName })
        if (typeof tone === 'string' && tone.startsWith('var(')) {
          toneVar = tone
        }
      }

      // Emit tone only if we successfully resolved it
      if (toneVar) {
        vars[toneKey] = toneVar
      } else if (toneRaw && typeof toneRaw === 'string') {
        // Parsing failed - log an error but don't emit erroneous variables
        console.error(`[PaletteResolver] Failed to parse tone reference for ${toneKey}:`, toneRaw)
      }

      // Always process on-tone, even if tone wasn't found (some levels might only have on-tone defined)
      {

        // Map on-tone to core color reference (black/white)
        // If theme JSON specifies on-tone, use it; otherwise default to black
        // AA compliance will be handled reactively in Phase 3
        // For 'default' level, check if we need to use the referenced level's on-tone
        // Use the value we already checked above, or look it up again
        let onToneRaw = onToneRawCheck ?? themeIndex[`${mode}::${onToneName}`]?.value
        if (lvl === 'default' && !onToneRaw) {
          const defaultRef = themeIndex[`${mode}::palette/${pk}/default`]?.value
          if (defaultRef && typeof defaultRef === 'string') {
            const parsed = parseTokenReference(defaultRef, context)
            if (parsed && parsed.type === 'brand' && parsed.path.length >= 3) {
              // Check if it's a palette reference: palettes.{paletteKey}.{level}
              if (parsed.path[0] === 'palettes' && parsed.path[1] === pk && /^\d+$/.test(parsed.path[2])) {
                const referencedLevel = parsed.path[2]
                onToneRaw = themeIndex[`${mode}::palette/${pk}/${referencedLevel}/color/on-tone`]?.value
              }
            }
          }
        }
        let onToneVar: string

        if (typeof onToneRaw === 'string') {
          const s = onToneRaw.trim()
          const sLower = s.toLowerCase()

          // Handle direct hex values and color names
          if (sLower === '#ffffff' || sLower === 'white') {
            onToneVar = `var(${paletteCore(modeLower, 'white')})`
          } else if (sLower === '#000000' || sLower === 'black') {
            onToneVar = `var(${paletteCore(modeLower, 'black')})`
          } else {
            // Use centralized parser to handle all brand reference formats
            const parsed = parseTokenReference(onToneRaw, context)
            if (parsed && parsed.type === 'brand') {
              const pathParts = parsed.path
              // Check if it's a core color reference
              if (pathParts.length >= 3 && pathParts[0] === 'palettes' && (pathParts[1] === 'core-colors' || pathParts[1] === 'core')) {
                const colorName = pathParts[pathParts.length - 1]
                if (colorName === 'white') {
                  onToneVar = `var(${paletteCore(modeLower, 'white')})`
                } else if (colorName === 'black') {
                  onToneVar = `var(${paletteCore(modeLower, 'black')})`
                } else {
                  // Try to resolve as CSS var
                  const cssVar = resolveTokenReferenceToCssVar(onToneRaw, context)
                  onToneVar = cssVar || `var(${paletteCore(modeLower, 'black')})`
                }
              } else if (pathParts.length >= 2 && pathParts[0] === 'palettes' && (pathParts[1] === 'white' || pathParts[1] === 'black')) {
                // Handle {brand.palettes.white} or {brand.palettes.black}
                const colorName = pathParts[1]
                onToneVar = `var(${paletteCore(modeLower, colorName)})`
              } else {
                // Try to resolve as CSS var
                const cssVar = resolveTokenReferenceToCssVar(onToneRaw, context)
                if (cssVar) {
                  onToneVar = cssVar
                } else {
                  // Try to resolve as theme reference
                  const onTone = resolveThemeRef({ collection: 'Theme', name: onToneName })
                  if (typeof onTone === 'string' && onTone.startsWith('var(')) {
                    onToneVar = onTone
                  } else {
                    // Default to black if unknown
                    onToneVar = `var(${paletteCore(modeLower, 'black')})`
                  }
                }
              }
            } else if (parsed && parsed.type === 'token') {
              // Handle token references like {tokens.colors.scale-01.000}
              // These are set by compliance fixes that point directly to token values
              const cssVar = resolveTokenReferenceToCssVar(onToneRaw, context)
              if (cssVar) {
                onToneVar = cssVar
              } else {
                // Default to black if token can't be resolved
                onToneVar = `var(${paletteCore(modeLower, 'black')})`
              }
            } else {
              // Not a brand or token reference, try to resolve as theme reference
              const cssVar = resolveTokenReferenceToCssVar(onToneRaw, context)
              if (cssVar) {
                onToneVar = cssVar
              } else {
                const onTone = resolveThemeRef({ collection: 'Theme', name: onToneName })
                if (typeof onTone === 'string' && onTone.startsWith('var(')) {
                  onToneVar = onTone
                } else {
                  // Default to black if unknown
                  onToneVar = `var(${paletteCore(modeLower, 'black')})`
                }
              }
            }
          }
        } else {
          // Default to black - AA compliance will update this reactively in Phase 3
          // Always generate on-tone CSS variable, even if not found in JSON
          onToneVar = `var(${paletteCore(modeLower, 'black')})`
        }

        // On-tone is emitted as-is from theme JSON. Theme JSON is the single source of truth.
        // Compliance fixes write corrected on-tones to theme JSON via writeCssVarsDirect().
        // We must NOT recalculate here — doing so would overwrite compliance fixes with
        // a naive core-white/core-black pick that may itself fail contrast.
        // Compliance checking is ComplianceService's responsibility (read-only scan).

        // Always set on-tone CSS variable from theme JSON - theme JSON is the source of truth.
        // Compliance fixes persist token references (e.g. {tokens.colors.scale-01.000}) that differ
        // from the initial core-white/core-black references. We must always use the theme JSON value
        // to ensure compliance fixes survive navigation and recomputation.
        vars[onToneKey] = onToneVar
      }
      // Do not emit per-level palette emphasis vars; consumers should reference brand-level text emphasis tokens directly
    })

    // After processing all levels, ensure primary-tone exists even if there's no 'default' level
    // This is needed because UIKit and other references use {palettes.neutral.default.color.tone}
    // which resolves to --recursica_brand_light_palettes_neutral_primary_color_tone
    const primaryToneVar = paletteVar(modeLower, pk, 'primary', 'color_tone')
    const primaryOnToneVar = paletteVar(modeLower, pk, 'primary', 'color_on-tone')

    // Always check localStorage first for primary level, even if primary-tone var already exists
    // This ensures randomization updates are reflected
    let primaryLevel: string | null = null
    try {
      const raw = localStorage.getItem(`palette-primary-level:${pk}:${modeLower}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed === 'string') {
          primaryLevel = parsed.padStart(3, '0')
        }
      }
    } catch (err) {
      // Ignore localStorage errors
    }

    // If we have a primary level from localStorage, use it (even if primary-tone var already exists)
    // This ensures randomization updates override the JSON default
    if (primaryLevel) {
      const targetToneVar = paletteVar(modeLower, pk, primaryLevel, 'color_tone')
      const targetOnToneVar = paletteVar(modeLower, pk, primaryLevel, 'color_on-tone')
      if (vars[targetToneVar]) {
        vars[primaryToneVar] = `var(${targetToneVar})`
        if (vars[targetOnToneVar]) {
          vars[primaryOnToneVar] = `var(${targetOnToneVar})`
        }
      }
    } else if (!vars[primaryToneVar]) {
      // Generate primary tone from theme JSON - no DOM preservation
      // Theme JSON is the single source of truth
      // If no localStorage value, try to find a suitable fallback level (prefer 500, then 400, then 600, then first available)
      const fallbackLevels = ['500', '400', '600', '300', '700', '200', '800', '100', '900', '050']
      for (const level of fallbackLevels) {
        const fallbackToneVar = paletteVar(modeLower, pk, level, 'color_tone')
        if (vars[fallbackToneVar]) {
          primaryLevel = level
          break
        }
      }

      // If we found a primary level (from fallback), create primary-tone and primary-on-tone by referencing it
      if (primaryLevel) {
        const targetToneVar = paletteVar(modeLower, pk, primaryLevel, 'color_tone')
        const targetOnToneVar = paletteVar(modeLower, pk, primaryLevel, 'color_on-tone')
        if (vars[targetToneVar]) {
          vars[primaryToneVar] = `var(${targetToneVar})`
          if (vars[targetOnToneVar]) {
            vars[primaryOnToneVar] = `var(${targetOnToneVar})`
          }
        }
      }
    }
  })

  // Process core-colors.interactive with states (default/hover) and types (tone/on-tone)
  // Also process other core-colors (alert, warning, success, black, white)
  try {
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    const themes = root?.themes || root
    const coreColorsRaw: any = (mode === 'Light' ? themes?.light?.palettes?.['core-colors'] : themes?.dark?.palettes?.['core-colors']) || {}
    // Handle $value wrapper: core-colors may be { $type: "color", $value: { black: {...}, interactive: {...} } }
    const coreColors: any = coreColorsRaw?.$value || coreColorsRaw

    // Process interactive with states
    const interactive: any = coreColors?.interactive || {}
    const defaultState: any = interactive?.default || {}
    if (defaultState?.tone) {
      const toneValue = getColorVar(defaultState.tone)
      vars[paletteCore(modeLower, 'interactive', 'default', 'tone')] = toneValue
    }
    if (defaultState?.['on-tone']) {
      const onToneValue = getColorVar(defaultState['on-tone'])
      vars[paletteCore(modeLower, 'interactive', 'default', 'on-tone')] = onToneValue
    }

    const hoverState: any = interactive?.hover || {}
    if (hoverState?.tone) {
      const toneValue = getColorVar(hoverState.tone)
      vars[paletteCore(modeLower, 'interactive', 'hover', 'tone')] = toneValue
    }
    if (hoverState?.['on-tone']) {
      const onToneValue = getColorVar(hoverState['on-tone'])
      vars[paletteCore(modeLower, 'interactive', 'hover', 'on-tone')] = onToneValue
    }

    // ─── Core color on-tone computation ───
    // Black/White: hardcoded opposites. Alert/Warning/Success: stepping algorithm.
    const coreWhiteRef = `var(${paletteCore(modeLower, 'white')})`
    const coreBlackRef = `var(${paletteCore(modeLower, 'black')})`

    // Read emphasis opacities for stepping contrast checks
    // The vars may contain var() references like "var(--recursica_tokens_opacities_solid, 1)"
    // or plain numeric strings like "0.87". Extract the number.

    const coreColorKeys = ['black', 'white', 'alert', 'warning', 'success']
    coreColorKeys.forEach((colorKey) => {
      const colorDef: any = coreColors?.[colorKey]
      if (colorDef?.tone) {
        const toneValue = getColorVar(colorDef.tone)
        vars[paletteCore(modeLower, colorKey, 'tone')] = toneValue
        vars[paletteCore(modeLower, colorKey)] = toneValue
      }

      // ─── On-tone computation ───
      // All core colors: read on-tone from theme JSON as-is.
      // Theme JSON is the single source of truth. Compliance fixes write corrected
      // on-tones via writeCssVarsDirect(). We do NOT re-derive here.
      // Fallback: black→white, white→black for default cases.
      if (colorDef?.['on-tone']) {
        const onToneValue = getColorVar(colorDef['on-tone'])
        vars[paletteCore(modeLower, colorKey, 'on-tone')] = onToneValue
      } else if (colorKey === 'black') {
        vars[paletteCore(modeLower, 'black', 'on-tone')] = coreWhiteRef
      } else if (colorKey === 'white') {
        vars[paletteCore(modeLower, 'white', 'on-tone')] = coreBlackRef
      }

      // Interactive
      if (colorDef?.interactive) {
        if (typeof colorDef.interactive === 'object' && !colorDef.interactive.$value && colorDef.interactive['on-tone']) {
          const interactiveOnToneValue = getColorVar(colorDef.interactive['on-tone'])
          vars[paletteCore(modeLower, colorKey, 'interactive', 'on-tone')] = interactiveOnToneValue
        } else if (typeof colorDef.interactive === 'object' && colorDef.interactive.$value) {
          const interactiveValue = getColorVar(colorDef.interactive)
          vars[paletteCore(modeLower, colorKey, 'interactive')] = interactiveValue
        } else {
          const interactiveValue = getColorVar(colorDef.interactive)
          vars[paletteCore(modeLower, colorKey, 'interactive')] = interactiveValue
        }
      }
    })
  } catch { }


  return vars
}

