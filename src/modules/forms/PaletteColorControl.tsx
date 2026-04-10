import { useRef, useState, useEffect, useMemo } from 'react'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { tokenColor, parseBrandCssVar, extractColorToken, extractColorTokenFromColorMix, unwrapVar } from '../../core/css/cssVarBuilder'
import { contrastRatio } from '../theme/contrastUtil'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { TextField } from '../../components/adapters/TextField'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../components/utils/cssVarNames'
import './PaletteColorControl.css'

type PaletteColorControlProps = {
  /** The CSS variable name to set when a color is selected */
  targetCssVar: string
  /** Optional array of CSS variable names to set when a color is selected (for multiple selections) */
  targetCssVars?: string[]
  /** Optional label for the control */
  label?: string
  /** Optional current value CSS variable to display (if different from target) */
  currentValueCssVar?: string
  /** Optional fallback display value if CSS var is not set */
  fallbackLabel?: string
  /** Size of the color swatch */
  swatchSize?: number
  /** Font size for the label text */
  fontSize?: number
  /** Optional CSS variable name for the color to check contrast against */
  contrastColorCssVar?: string
  /** Optional callback when a color is selected, receives the selected CSS var name */
  onSelect?: (cssVar: string) => void
}

/**
 * A reusable form control for selecting palette colors via CSS variables.
 * The picker sets the target CSS variable directly, updating the UI instantly.
 */
export default function PaletteColorControl({
  targetCssVar,
  targetCssVars,
  label,
  currentValueCssVar,
  fallbackLabel = 'None',
  swatchSize = 16,
  fontSize = 13,
  contrastColorCssVar,
  onSelect: onSelectProp,
}: PaletteColorControlProps) {
  const { palettes, theme: themeJson, tokens } = useVars()
  const { mode } = useThemeMode()
  const textFieldRef = useRef<HTMLDivElement>(null)
  const displayCssVar = currentValueCssVar || targetCssVar

  // Get available palette keys and levels for token-to-palette mapping
  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    const staticPalettes: string[] = []
    const modeLower = mode.toLowerCase()
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const modePal: any = themes?.[modeLower]?.palettes || themes?.[modeLower]?.palette || {}
      Object.keys(modePal).forEach((k) => {
        if (k !== 'core' && k !== 'core-colors' && !dynamic.includes(k)) {
          staticPalettes.push(k)
        }
      })
    } catch { }
    return Array.from(new Set([...dynamic, ...staticPalettes]))
  }, [palettes, themeJson, mode])

  const paletteLevels = useMemo(() => {
    const levelsByPalette: Record<string, string[]> = {}
    const modeLower = mode.toLowerCase()
    paletteKeys.forEach((pk) => {
      try {
        const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
        // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
        const themes = root?.themes || root
        const paletteData: any = themes?.[modeLower]?.palettes?.[pk] || themes?.[modeLower]?.palette?.[pk]
        if (paletteData) {
          const levels = Object.keys(paletteData).filter((k) => /^(\d{2,4}|000|1000)$/.test(k))
          levels.sort((a, b) => {
            const aNum = a === '000' ? 0 : a === '050' ? 50 : a === '1000' ? 1000 : Number(a)
            const bNum = b === '000' ? 0 : b === '050' ? 50 : b === '1000' ? 1000 : Number(b)
            return bNum - aNum
          })
          levelsByPalette[pk] = levels
        }
      } catch { }
      if (!levelsByPalette[pk]) {
        levelsByPalette[pk] = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']
      }
    })
    return levelsByPalette
  }, [paletteKeys, themeJson, mode])

  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    const modeLower = mode.toLowerCase()
    return `--recursica_brand_themes_${modeLower}_palettes_${paletteKey}_${level}_color_tone`
  }

  // Helper to find palette swatch that matches a token hex
  const findPaletteForToken = (tokenFamily: string, tokenLevel: string): { paletteKey: string; level: string } | null => {
    const tokenCssVar = tokenColor(tokenFamily, tokenLevel)
    const tokenHex = readCssVarResolved(tokenCssVar)
    if (!tokenHex || !/^#[0-9a-f]{6}$/i.test(tokenHex)) return null

    const normalizedTokenHex = tokenHex.toLowerCase().trim()

    // Find the first palette swatch that matches this hex
    for (const pk of paletteKeys) {
      const levels = paletteLevels[pk] || []
      for (const level of levels) {
        const paletteCssVar = buildPaletteCssVar(pk, level)
        const paletteHex = readCssVarResolved(paletteCssVar)
        if (paletteHex && /^#[0-9a-f]{6}$/i.test(paletteHex)) {
          if (paletteHex.toLowerCase().trim() === normalizedTokenHex) {
            return { paletteKey: pk, level }
          }
        }
      }
    }

    return null
  }

  // Helper function to format palette name (e.g., "palette-1" -> "Palette 1", "neutral" -> "Neutral")
  const formatPaletteName = (paletteKey: string): string => {
    return paletteKey
      .replace(/[-_/]+/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .trim()
  }

  // Helper to recursively follow CSS variable chain to find palette/token references
  const findPaletteInChain = (cssVarName: string, depth: number = 0, visited: Set<string> = new Set()): string | null => {
    if (depth > 5) return null // Prevent infinite loops
    if (visited.has(cssVarName)) return null // Prevent circular references
    visited.add(cssVarName)

    const value = readCssVar(cssVarName)
    if (!value) return null

    const trimmed = value.trim()

    // PRIORITY 1: Check for core colors FIRST (before regular palettes)
    const brandParsed = parseBrandCssVar(trimmed)
    if (brandParsed) {
      if (brandParsed.type === 'core-color') return trimmed
      if (brandParsed.type === 'palette') return trimmed
    }

    // Check if this value directly contains a token reference
    const tokenParsed = extractColorToken(trimmed)
    if (tokenParsed) return trimmed

    // Check for color-mix() functions that contain palette or token references
    if (trimmed.includes('color-mix')) {
      // Check for palette refs inside color-mix
      const innerVarMatch = trimmed.match(/var\s*\(\s*(--[^)]+)\s*\)/)
      if (innerVarMatch) {
        const innerParsed = parseBrandCssVar(innerVarMatch[1])
        if (innerParsed && (innerParsed.type === 'palette' || innerParsed.type === 'core-color')) return trimmed
      }
      // Check for token refs inside color-mix
      const colorMixToken = extractColorTokenFromColorMix(trimmed)
      if (colorMixToken) return trimmed
    }

    // If it's a var() reference, extract the inner variable name and recurse
    const innerVarName = unwrapVar(trimmed)
    if (innerVarName) {
      const result = findPaletteInChain(innerVarName, depth + 1, visited)
      if (result) return result
    }

    return null
  }

  const [refreshKey, setRefreshKey] = useState(0) // Force re-read when picker closes

  // Listen for CSS variable updates to refresh the label - only for relevant vars
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const relevantVars = [displayCssVar, targetCssVar, ...(targetCssVars || [])].filter(Boolean)

    const handleCssVarsUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars

      // Only update if one of our CSS vars was changed
      if (!Array.isArray(updatedVars)) {
        return
      }

      const hasRelevantUpdate = relevantVars.some(v => updatedVars.includes(v))
      if (!hasRelevantUpdate) {
        return
      }

      // Debounce to prevent excessive updates
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        // Force re-computation of display label when CSS vars are updated
        setRefreshKey(prev => prev + 1)
      }, 16) // ~1 frame at 60fps
    }

    window.addEventListener('cssVarsUpdated', handleCssVarsUpdated)
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      window.removeEventListener('cssVarsUpdated', handleCssVarsUpdated)
    }
  }, [displayCssVar, targetCssVar, targetCssVars])

  // Compute display label reactively based on CSS variable value
  const computedDisplayLabel = useMemo(() => {
    // First try to find palette reference in the CSS variable chain
    let paletteValue = findPaletteInChain(displayCssVar)
    let cssValue = paletteValue || readCssVar(displayCssVar)

    // If we didn't find a palette reference in the chain, try resolving to hex and matching
    if (!paletteValue && cssValue) {
      // Resolve deeper to handle UIKit variables that chain to other variables
      const resolvedHex = readCssVarResolved(displayCssVar, 10)
      if (resolvedHex && /^#[0-9a-f]{6}$/i.test(resolvedHex.trim())) {
        const normalizedResolvedHex = resolvedHex.trim().toLowerCase()
        // Try to find which palette this hex matches
        for (const pk of paletteKeys) {
          const levels = paletteLevels[pk] || []
          for (const level of levels) {
            const paletteCssVar = buildPaletteCssVar(pk, level)
            const paletteHex = readCssVarResolved(paletteCssVar, 10)
            if (paletteHex && paletteHex.trim().toLowerCase() === normalizedResolvedHex) {
              // Found a match! Return the palette reference format
              cssValue = `var(${paletteCssVar})`
              paletteValue = cssValue
              break
            }
          }
          if (paletteValue) break
        }
      }
    }

    // If we found a palette value through hex matching, extract and return it
    if (paletteValue) {
      // Use central parser to extract palette/core info
      const brandParsed = parseBrandCssVar(paletteValue)
      if (brandParsed && brandParsed.type === 'core-color') {
        const coreKey = brandParsed.path
        // Handle interactive colors (path segments joined by _)
        if (coreKey === 'interactive_default_tone' || coreKey === 'interactive-default-tone' || coreKey === 'interactive-default' || coreKey === 'interactive_default') {
          return 'Core / Interactive / Default'
        }
        if (coreKey === 'interactive_hover_tone' || coreKey === 'interactive-hover-tone' || coreKey === 'interactive-hover' || coreKey === 'interactive_hover') {
          return 'Core / Interactive / Hover'
        }
        if (coreKey === 'interactive' || coreKey === 'interactive-tone' || coreKey === 'interactive_tone') {
          return 'Core / Interactive'
        }
        const formattedCore = formatPaletteName(coreKey.replace(/_/g, '-'))
        return `Core / ${formattedCore}`
      }
      if (brandParsed && brandParsed.type === 'palette') {
        const { paletteName: paletteKey, level } = brandParsed
        if (paletteKey === 'core-interactive') {
          if (level === 'default') return 'Core / Interactive / Default'
          if (level === 'hover') return 'Core / Interactive / Hover'
          return `Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`
        }
        const formattedPalette = formatPaletteName(paletteKey)
        if (level === 'default') return formattedPalette
        const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
        return `${formattedPalette} / ${displayLevel}`
      }
    }

    if (!cssValue) {
      // Check if the CSS variable exists (even if it's a UIKit variable)
      const rawValue = readCssVar(displayCssVar)
      if (rawValue && rawValue.trim()) {
        // CSS variable is set, but we couldn't parse it - try resolving deeper
        const resolvedHex = readCssVarResolved(displayCssVar, 10)
        if (resolvedHex && /^#[0-9a-f]{6}$/i.test(resolvedHex.trim())) {
          const normalizedResolvedHex = resolvedHex.trim().toLowerCase()
          const modeLower = mode.toLowerCase()

          // PRIORITY 1: Check core colors FIRST (before regular palettes)
          // Core colors can be: black, white, alert-tone, warning-tone, success-tone, interactive-default-tone, interactive-hover-tone
          // Also check without -tone suffix for backwards compatibility
          const coreColorKeys = [
            'black', 'black-tone',
            'white', 'white-tone',
            'interactive-default-tone', 'interactive-default',
            'interactive-hover-tone', 'interactive-hover',
            'alert-tone', 'alert',
            'warning-tone', 'warning',
            'success-tone', 'success'
          ]
          for (const coreKey of coreColorKeys) {
            const coreCssVar = `--recursica_brand_themes_${modeLower}_palettes_core_${coreKey.replace(/-/g, '_')}`
            const coreHex = readCssVarResolved(coreCssVar, 10)
            if (coreHex && coreHex.trim().toLowerCase() === normalizedResolvedHex) {
              // Found a core color match! Format and return
              const normalizedKey = coreKey.replace(/-tone$/, '')
              if (normalizedKey === 'interactive-default') {
                return 'Core / Interactive / Default'
              }
              if (normalizedKey === 'interactive-hover') {
                return 'Core / Interactive / Hover'
              }
              if (normalizedKey === 'interactive') {
                return 'Core / Interactive'
              }
              const formattedCore = formatPaletteName(normalizedKey)
              return `Core / ${formattedCore}`
            }
          }

          // PRIORITY 2: Only check regular palettes if no core color match was found
          for (const pk of paletteKeys) {
            const levels = paletteLevels[pk] || []
            for (const level of levels) {
              const paletteCssVar = buildPaletteCssVar(pk, level)
              const paletteHex = readCssVarResolved(paletteCssVar, 10)
              if (paletteHex && paletteHex.trim().toLowerCase() === normalizedResolvedHex) {
                // Found a match! Display the palette name and level
                // Special handling for core-interactive palette
                if (pk === 'core-interactive') {
                  if (level === 'default') {
                    return 'Core / Interactive / Default'
                  } else if (level === 'hover') {
                    return 'Core / Interactive / Hover'
                  } else {
                    return `Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`
                  }
                }
                const formattedPalette = formatPaletteName(pk)
                if (level === 'default') {
                  return formattedPalette
                }
                const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
                return `${formattedPalette} / ${displayLevel}`
              }
            }
          }
          // It's a valid color but doesn't match any palette
          return 'Custom color'
        }
        return 'Set'
      }
      return fallbackLabel
    }

    // Extract palette name and level from var() reference using central parsers
    const brandParsedCss = parseBrandCssVar(cssValue)
    // Also try extracting from color-mix if not a direct match
    let brandParsedColorMix: ReturnType<typeof parseBrandCssVar> = null
    if (!brandParsedCss && cssValue.includes('color-mix')) {
      const innerMatch = cssValue.match(/var\s*\(\s*(--[^)]+)\s*\)/)
      if (innerMatch) {
        brandParsedColorMix = parseBrandCssVar(innerMatch[1])
      }
    }
    const brandResult = brandParsedCss || brandParsedColorMix

    // Try extracting color token
    let colorTokenResult = extractColorToken(cssValue)
    if (!colorTokenResult) {
      colorTokenResult = extractColorTokenFromColorMix(cssValue)
    }

    if (brandResult && (brandResult.type === 'palette' || brandResult.type === 'core-color')) {
      if (brandResult.type === 'palette') {
        const { paletteName: paletteKey, level } = brandResult
        if (paletteKey === 'core-interactive') {
          if (level === 'default') return 'Core / Interactive / Default'
          if (level === 'hover') return 'Core / Interactive / Hover'
          return `Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`
        }
        const formattedPalette = formatPaletteName(paletteKey)
        if (level === 'default') return formattedPalette
        const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
        return `${formattedPalette} / ${displayLevel}`
      }
    }

    if (colorTokenResult) {
      const { family, level } = colorTokenResult
      // Try to find matching palette swatch for this token
      const paletteMatch = findPaletteForToken(family, level)
      if (paletteMatch) {
        const formattedPalette = formatPaletteName(paletteMatch.paletteKey)
        const displayLevel = paletteMatch.level === 'primary' ? 'primary' : paletteMatch.level
        return `${formattedPalette} / ${displayLevel}`
      }
      // Fallback to token name if no palette match found
      const formattedFamily = formatPaletteName(family)
      return `${formattedFamily} / ${level}`
    }

    if (cssValue.startsWith('#') || cssValue.startsWith('rgb')) {
      return 'Custom color'
    }

    // If it's a var() reference but doesn't match our patterns, try resolving deeper
    // This handles UIKit component variables that chain to palette references
    if (cssValue.trim().startsWith('var(') || cssValue.trim().includes('var(')) {
      // Try resolving deeper to find palette references in the chain
      const resolvedHex = readCssVarResolved(displayCssVar, 10)
      if (resolvedHex && /^#[0-9a-f]{6}$/i.test(resolvedHex.trim())) {
        const normalizedResolvedHex = resolvedHex.trim().toLowerCase()
        // Try to find which palette this hex matches
        for (const pk of paletteKeys) {
          const levels = paletteLevels[pk] || []
          for (const level of levels) {
            const paletteCssVar = buildPaletteCssVar(pk, level)
            const paletteHex = readCssVarResolved(paletteCssVar, 10)
            if (paletteHex && paletteHex.trim().toLowerCase() === normalizedResolvedHex) {
              // Found a match! Display the palette name and level
              const formattedPalette = formatPaletteName(pk)
              const displayLevel = level === 'primary' ? 'primary' : level
              return `${formattedPalette} / ${displayLevel}`
            }
          }
        }
        // It's a valid color but doesn't match any palette
        return 'Custom color'
      }
      // It's a valid CSS variable reference, just not one we can parse nicely
      return 'Set'
    }

    return fallbackLabel
  }, [displayCssVar, paletteKeys, paletteLevels, mode, fallbackLabel, refreshKey])

  const [displayLabel, setDisplayLabel] = useState<string>(computedDisplayLabel)

  // Helper function to update display label from CSS variable
  const updateDisplayLabel = () => {
    // First try to find palette reference in the CSS variable chain
    let paletteValue = findPaletteInChain(displayCssVar)
    let cssValue = paletteValue || readCssVar(displayCssVar)

    // If the value is explicitly 'transparent', treat it as None/unset
    if (cssValue === 'transparent') {
      setDisplayLabel(fallbackLabel)
      return
    }

    // If we didn't find a palette reference in the chain, try resolving to hex and matching
    if (!paletteValue && cssValue) {
      // Resolve deeper to handle UIKit variables that chain to other variables
      const resolvedHex = readCssVarResolved(displayCssVar, 10)
      if (resolvedHex && /^#[0-9a-f]{6}$/i.test(resolvedHex.trim())) {
        const normalizedResolvedHex = resolvedHex.trim().toLowerCase()
        const modeLower = mode.toLowerCase()

        // PRIORITY 1: Check core colors FIRST (before regular palettes)
        // Core colors can be: black, white, alert-tone, warning-tone, success-tone, interactive-default-tone, interactive-hover-tone
        // Also check without -tone suffix for backwards compatibility
        const coreColorKeys = [
          'black', 'black-tone',
          'white', 'white-tone',
          'interactive-default-tone', 'interactive-default',
          'interactive-hover-tone', 'interactive-hover',
          'alert-tone', 'alert',
          'warning-tone', 'warning',
          'success-tone', 'success'
        ]
        for (const coreKey of coreColorKeys) {
          const coreCssVar = `--recursica_brand_themes_${modeLower}_palettes_core_${coreKey.replace(/-/g, '_')}`
          const coreHex = readCssVarResolved(coreCssVar, 10)
          if (coreHex && coreHex.trim().toLowerCase() === normalizedResolvedHex) {
            // Found a core color match! Return the core color reference
            cssValue = `var(${coreCssVar})`
            paletteValue = cssValue
            break
          }
        }

        // PRIORITY 2: Only check regular palettes if no core color match was found
        if (!paletteValue) {
          for (const pk of paletteKeys) {
            const levels = paletteLevels[pk] || []
            for (const level of levels) {
              const paletteCssVar = buildPaletteCssVar(pk, level)
              const paletteHex = readCssVarResolved(paletteCssVar, 10)
              if (paletteHex && paletteHex.trim().toLowerCase() === normalizedResolvedHex) {
                // Found a match! Return the palette reference format
                cssValue = `var(${paletteCssVar})`
                paletteValue = cssValue
                break
              }
            }
            if (paletteValue) break
          }
        }
      }
    }

    // If we found a palette value through hex matching, extract and display it immediately
    if (paletteValue) {
      // Use central parser
      const brandParsed = parseBrandCssVar(paletteValue)
      if (brandParsed && brandParsed.type === 'core-color') {
        const coreKey = brandParsed.path
        if (coreKey === 'interactive_default_tone' || coreKey === 'interactive-default-tone' || coreKey === 'interactive-default' || coreKey === 'interactive_default') {
          setDisplayLabel('Core / Interactive / Default')
          return
        }
        if (coreKey === 'interactive_hover_tone' || coreKey === 'interactive-hover-tone' || coreKey === 'interactive-hover' || coreKey === 'interactive_hover') {
          setDisplayLabel('Core / Interactive / Hover')
          return
        }
        if (coreKey === 'interactive' || coreKey === 'interactive-tone' || coreKey === 'interactive_tone') {
          setDisplayLabel('Core / Interactive')
          return
        }
        const formattedCore = formatPaletteName(coreKey.replace(/_/g, '-'))
        setDisplayLabel(`Core / ${formattedCore}`)
        return
      }

      if (brandParsed && brandParsed.type === 'palette') {
        const { paletteName: paletteKey, level } = brandParsed
        if (paletteKey === 'core-interactive') {
          if (level === 'default') {
            setDisplayLabel('Core / Interactive / Default')
          } else if (level === 'hover') {
            setDisplayLabel('Core / Interactive / Hover')
          } else {
            setDisplayLabel(`Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`)
          }
          return
        }
        const formattedPalette = formatPaletteName(paletteKey)
        if (level === 'default') {
          setDisplayLabel(formattedPalette)
        } else {
          const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
          setDisplayLabel(`${formattedPalette} / ${displayLevel}`)
        }
        return
      }
    }

    // If cssValue is empty or undefined, check if the CSS variable exists at all
    // Even if it's a UIKit component variable, it's still "set"
    if (!cssValue) {
      // Check if the CSS variable exists (even if it's a UIKit variable)
      const rawValue = readCssVar(displayCssVar)
      if (rawValue && rawValue.trim()) {
        // CSS variable is set, but we couldn't parse it - try resolving deeper to find palette match
        const resolvedHex = readCssVarResolved(displayCssVar, 10)
        if (resolvedHex && /^#[0-9a-f]{6}$/i.test(resolvedHex.trim())) {
          const normalizedResolvedHex = resolvedHex.trim().toLowerCase()
          const modeLower = mode.toLowerCase()

          // PRIORITY 1: Check core colors FIRST (before regular palettes)
          // Core colors can be: black, white, alert-tone, warning-tone, success-tone, interactive-default-tone, interactive-hover-tone
          // Also check without -tone suffix for backwards compatibility
          const coreColorKeys = [
            'black', 'black-tone',
            'white', 'white-tone',
            'interactive-default-tone', 'interactive-default',
            'interactive-hover-tone', 'interactive-hover',
            'alert-tone', 'alert',
            'warning-tone', 'warning',
            'success-tone', 'success'
          ]
          for (const coreKey of coreColorKeys) {
            const coreCssVar = `--recursica_brand_themes_${modeLower}_palettes_core_${coreKey.replace(/-/g, '_')}`
            const coreHex = readCssVarResolved(coreCssVar, 10)
            if (coreHex && coreHex.trim().toLowerCase() === normalizedResolvedHex) {
              // Found a core color match! Format and display
              const normalizedKey = coreKey.replace(/-tone$/, '')
              if (normalizedKey === 'interactive-default') {
                setDisplayLabel('Core / Interactive / Default')
              } else if (normalizedKey === 'interactive-hover') {
                setDisplayLabel('Core / Interactive / Hover')
              } else if (normalizedKey === 'interactive') {
                setDisplayLabel('Core / Interactive')
              } else {
                const formattedCore = formatPaletteName(normalizedKey)
                setDisplayLabel(`Core / ${formattedCore}`)
              }
              return
            }
          }

          // PRIORITY 2: Only check regular palettes if no core color match was found
          for (const pk of paletteKeys) {
            const levels = paletteLevels[pk] || []
            for (const level of levels) {
              const paletteCssVar = buildPaletteCssVar(pk, level)
              const paletteHex = readCssVarResolved(paletteCssVar, 10)
              if (paletteHex && paletteHex.trim().toLowerCase() === normalizedResolvedHex) {
                // Found a match! Display the palette name and level
                // Special handling for core-interactive palette
                if (pk === 'core-interactive') {
                  if (level === 'default') {
                    setDisplayLabel('Core / Interactive / Default')
                  } else if (level === 'hover') {
                    setDisplayLabel('Core / Interactive / Hover')
                  } else {
                    setDisplayLabel(`Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`)
                  }
                  return
                }
                const formattedPalette = formatPaletteName(pk)
                if (level === 'default') {
                  setDisplayLabel(formattedPalette)
                } else {
                  const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
                  setDisplayLabel(`${formattedPalette} / ${displayLevel}`)
                }
                return
              }
            }
          }
          // It's a valid color but doesn't match any palette
          setDisplayLabel('Custom color')
          return
        }
        // It's set but we can't display it nicely - show a generic "Set" message
        setDisplayLabel('Set')
        return
      }
      setDisplayLabel(fallbackLabel)
      return
    }

    // Extract palette name and level from var() reference using central parsers
    const brandParsedCss2 = parseBrandCssVar(cssValue)
    let brandParsedColorMix2: ReturnType<typeof parseBrandCssVar> = null
    if (!brandParsedCss2 && cssValue.includes('color-mix')) {
      const innerMatch = cssValue.match(/var\s*\(\s*(--[^)]+)\s*\)/)
      if (innerMatch) {
        brandParsedColorMix2 = parseBrandCssVar(innerMatch[1])
      }
    }
    const brandResult2 = brandParsedCss2 || brandParsedColorMix2

    let colorTokenResult2 = extractColorToken(cssValue)
    if (!colorTokenResult2) {
      colorTokenResult2 = extractColorTokenFromColorMix(cssValue)
    }

    if (brandResult2 && brandResult2.type === 'palette') {
      const { paletteName: paletteKey, level } = brandResult2
      if (paletteKey === 'core-interactive') {
        if (level === 'default') {
          setDisplayLabel('Core / Interactive / Default')
        } else if (level === 'hover') {
          setDisplayLabel('Core / Interactive / Hover')
        } else {
          setDisplayLabel(`Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`)
        }
        return
      }
      const formattedPalette = formatPaletteName(paletteKey)
      if (level === 'default') {
        setDisplayLabel(formattedPalette)
      } else {
        const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
        setDisplayLabel(`${formattedPalette} / ${displayLevel}`)
      }
      return
    }

    if (colorTokenResult2) {
      const { family, level } = colorTokenResult2
      // Try to find matching palette swatch for this token
      const paletteMatch = findPaletteForToken(family, level)
      if (paletteMatch) {
        const formattedPalette = formatPaletteName(paletteMatch.paletteKey)
        const displayLevel = paletteMatch.level === 'primary' ? 'primary' : paletteMatch.level
        setDisplayLabel(`${formattedPalette} / ${displayLevel}`)
        return
      }
      // Fallback to token name if no palette match found
      const formattedFamily = formatPaletteName(family)
      setDisplayLabel(`${formattedFamily} / ${level}`)
      return
    }

    // If it's a direct color value
    if (cssValue.startsWith('#') || cssValue.startsWith('rgb')) {
      setDisplayLabel('Custom color')
      return
    }

    // If it's a var() reference but doesn't match our patterns, try resolving deeper
    // This handles UIKit component variables that chain to palette references
    if (cssValue.trim().startsWith('var(') || cssValue.trim().includes('var(')) {
      // Try resolving deeper to find palette references in the chain
      const resolvedHex = readCssVarResolved(displayCssVar, 10)
      if (resolvedHex && /^#[0-9a-f]{6}$/i.test(resolvedHex.trim())) {
        const normalizedResolvedHex = resolvedHex.trim().toLowerCase()
        // Try to find which palette this hex matches
        for (const pk of paletteKeys) {
          const levels = paletteLevels[pk] || []
          for (const level of levels) {
            const paletteCssVar = buildPaletteCssVar(pk, level)
            const paletteHex = readCssVarResolved(paletteCssVar, 10)
            if (paletteHex && paletteHex.trim().toLowerCase() === normalizedResolvedHex) {
              // Found a match! Display the palette name and level
              // Special handling for core-interactive palette
              if (pk === 'core-interactive') {
                if (level === 'default') {
                  setDisplayLabel('Core / Interactive / Default')
                } else if (level === 'hover') {
                  setDisplayLabel('Core / Interactive / Hover')
                } else {
                  setDisplayLabel(`Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`)
                }
                return
              }
              const formattedPalette = formatPaletteName(pk)
              if (level === 'default') {
                setDisplayLabel(formattedPalette)
              } else {
                const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
                setDisplayLabel(`${formattedPalette} / ${displayLevel}`)
              }
              return
            }
          }
        }
        // It's a valid color but doesn't match any palette
        setDisplayLabel('Custom color')
        return
      }
      // It's a valid CSS variable reference, just not one we can parse nicely
      setDisplayLabel('Set')
      return
    }

    setDisplayLabel(fallbackLabel)
  }

  // Sync display label state with computed value
  useEffect(() => {
    setDisplayLabel(computedDisplayLabel)
  }, [computedDisplayLabel])

  // Update display label based on CSS variable value (for refresh mechanism)
  useEffect(() => {
    // Read immediately
    updateDisplayLabel()

    // Also read after a short delay to catch CSS variables that might be set via computed styles
    // This ensures we read the value even if it's set by varsStore after component mount
    const timeoutId = setTimeout(() => {
      updateDisplayLabel()
    }, 10)

    // Also read after a longer delay to catch any async CSS variable updates
    const timeoutId2 = setTimeout(() => {
      updateDisplayLabel()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
    }
  }, [displayCssVar, fallbackLabel, refreshKey, paletteKeys, paletteLevels, mode]) // Include refreshKey to force re-read

  // Check contrast if contrastColorCssVar is provided
  // Use the same approach as ButtonPreview
  const contrastWarning = useMemo(() => {
    if (!contrastColorCssVar) return null

    const tokenIndex = buildTokenIndex(tokens || {})

    // Read the CSS variable values - same as ButtonPreview
    // If the value is already a var() reference, resolveCssVarToHex will handle it recursively
    const currentColorValue = readCssVar(displayCssVar)
    const contrastColorValue = readCssVar(contrastColorCssVar)

    if (!currentColorValue || !contrastColorValue) return null

    // Use the same resolveCssVarToHex function as ButtonPreview
    // This function handles var() references recursively, including layer variables
    // that reference palette variables
    const currentHex = resolveCssVarToHex(currentColorValue, tokenIndex as any)
    const contrastHex = resolveCssVarToHex(contrastColorValue, tokenIndex as any)

    if (!currentHex || !contrastHex) {
      return null
    }

    const ratio = contrastRatio(currentHex, contrastHex)
    const AA_THRESHOLD = 4.5

    if (ratio < AA_THRESHOLD) {
      return {
        ratio: ratio.toFixed(2),
        passes: false,
      }
    }

    return null
  }, [contrastColorCssVar, displayCssVar, tokens, refreshKey, mode]) // Include mode and refreshKey to re-check when colors change

  const handleClick = (e: React.MouseEvent<HTMLDivElement | HTMLInputElement>) => {
    // Stop propagation to prevent closing parent panels/popovers
    e.stopPropagation()

    const el = textFieldRef.current
    if (!el) return
    try {
      // If multiple CSS vars are provided, pass them all to the picker
      const cssVarsToUpdate = targetCssVars && targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
        ; (window as any).openPalettePicker(el, targetCssVar, cssVarsToUpdate)
    } catch (err) {
      console.error('Failed to open palette picker:', err)
    }
  }

  // Check if color is null/not set
  const cssVarValue = readCssVar(displayCssVar)
  const isColorNull = displayLabel === 'None' || !cssVarValue || cssVarValue === 'transparent'
  const modeLower = mode.toLowerCase()

  // Resolve swatch fill color from :root to bypass scoped CSS engine shadowing.
  // When the toolbar panel has data-recursica-layer/theme attributes, scoped aliases
  // can shadow the inline override on :root. Reading the resolved hex directly avoids this.
  const resolvedSwatchColor = useMemo(() => {
    if (isColorNull) return 'transparent'
    const hex = readCssVarResolved(displayCssVar, 10)
    return hex && /^#[0-9a-f]{3,8}$/i.test(hex.trim()) ? hex.trim() : `var(${displayCssVar}, transparent)`
  }, [displayCssVar, isColorNull, refreshKey, mode])

  // Use the same border style as the overlay swatches
  // Match PaletteSwatchPicker's border style exactly
  // Use CSS variable reference directly (same as overlay) - template literal interpolation
  const swatchBorderColorVar = `--recursica_brand_themes_${modeLower}_palettes_neutral_500_color_tone`
  const swatchBorderColor = `var(${swatchBorderColorVar})`

  // Get highest layer number for background (same as PaletteSwatchPicker)
  const highestLayerNum = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const layersData: any = themes?.[modeLower]?.layers || themes?.[modeLower]?.layer || {}
      const layerKeys = Object.keys(layersData).filter(key => /^layer-\d+$/.test(key)).sort((a, b) => {
        const aNum = parseInt(a.replace('layer-', ''), 10)
        const bNum = parseInt(b.replace('layer-', ''), 10)
        return bNum - aNum // Sort descending to get highest first
      })
      return layerKeys.length > 0 ? layerKeys[0].replace('layer-', '') : '3'
    } catch {
      return '3'
    }
  }, [themeJson, modeLower])

  // Create swatch icon component
  const swatchIcon = isColorNull ? (
    <span
      aria-hidden
      className="palette-color-control-swatch"
      style={{
        width: swatchSize,
        height: swatchSize,
        display: 'block',
        flex: '0 0 auto',
        boxSizing: 'border-box',
        position: 'relative',
        border: `1px solid ${swatchBorderColor}`,
        borderRadius: 0,
        padding: 0,
        overflow: 'visible',
        minWidth: swatchSize,
        minHeight: swatchSize,
        flexShrink: 0,
      }}
    >
      <span
        className="palette-color-control-swatch-inner"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: `var(--recursica_brand_themes_${modeLower}_layers_layer-${highestLayerNum}_properties_surface)`,
          position: 'relative',
        }}
      >
        {/* Diagonal line through box */}
        <svg
          width={swatchSize}
          height={swatchSize}
          viewBox={`0 0 ${swatchSize} ${swatchSize}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <line
            x1="2"
            y1={swatchSize - 2}
            x2={swatchSize - 2}
            y2="2"
            stroke={`var(--recursica_brand_themes_${modeLower}_palettes_neutral_500_color_tone)`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  ) : (
    <span
      aria-hidden
      className="palette-color-control-swatch"
      style={{
        width: swatchSize,
        height: swatchSize,
        display: 'block',
        flex: '0 0 auto',
        boxSizing: 'border-box',
        borderRadius: 0,
        padding: 0,
        overflow: 'visible',
        minWidth: swatchSize,
        minHeight: swatchSize,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <span
        className="palette-color-control-swatch-inner"
        style={{
          background: resolvedSwatchColor,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </span>
  )

  // Create trailing icon with contrast warning if needed
  const trailingIcon = contrastWarning ? (
    <a
      href={`/theme/compliance`}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        window.location.href = '/theme/compliance'
      }}
      className="palette-color-control-compliance-link"
      title={`Poor contrast: ${contrastWarning.ratio}:1 (WCAG AA requires 4.5:1). Click to view compliance details.`}
      aria-label={`Poor contrast warning: ${contrastWarning.ratio}:1 ratio`}
    >
      {contrastWarning.ratio}:1
    </a>
  ) : undefined

  return (
    <>
      <div ref={textFieldRef}>
        <TextField
          label={label}
          value={displayLabel}
          leadingIcon={swatchIcon}
          trailingIcon={trailingIcon}
          state="default"
          readOnly={true}
          onClick={handleClick}
          layer="layer-0"
          style={{
            fontSize,
            cursor: 'pointer',
          }}
          className="palette-color-control-textfield"
        />
      </div>
      <PaletteSwatchPicker
        onSelect={(cssVar) => {
          // Force re-read of CSS variable when a selection is made
          setRefreshKey(prev => prev + 1)
          onSelectProp?.(cssVar)
        }}
      />
    </>
  )
}

