import { useRef, useState, useEffect, useMemo } from 'react'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { contrastRatio } from '../theme/contrastUtil'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
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
  fallbackLabel = 'Not set',
  swatchSize = 16,
  fontSize = 13,
  contrastColorCssVar,
}: PaletteColorControlProps) {
  const { palettes, theme: themeJson, tokens } = useVars()
  const { mode } = useThemeMode()
  const buttonRef = useRef<HTMLButtonElement>(null)
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
    } catch {}
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
      } catch {}
      if (!levelsByPalette[pk]) {
        levelsByPalette[pk] = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']
      }
    })
    return levelsByPalette
  }, [paletteKeys, themeJson, mode])
  
  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    const modeLower = mode.toLowerCase()
    return `--recursica-brand-themes-${modeLower}-palettes-${paletteKey}-${level}-tone`
  }
  
  // Helper to find palette swatch that matches a token hex
  const findPaletteForToken = (tokenFamily: string, tokenLevel: string): { paletteKey: string; level: string } | null => {
    const tokenCssVar = `--recursica-tokens-color-${tokenFamily}-${tokenLevel}`
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
    // Match: var(--recursica-brand-themes-{mode}-palettes-core-{colorKey})
    const coreMatch = trimmed.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone)?)\s*\)/i)
    if (coreMatch) {
      return trimmed
    }

    // PRIORITY 2: Check for regular palette references
    // Match levels: numeric (000, 050, 100-1000), primary, or default
    const paletteMatch = trimmed.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary|default|hover)-tone\s*\)/i)
    if (paletteMatch) {
      return trimmed
    }
    
    // Check if this value directly contains a token reference
    const tokenMatch = trimmed.match(/var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)/i)
    if (tokenMatch) {
      return trimmed
    }
    
    // Check for color-mix() functions that contain palette references
    const colorMixPaletteMatch = trimmed.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary|default|hover)-tone\s*\)[^)]*\)/i)
    if (colorMixPaletteMatch) {
      return trimmed
    }
    
    // Check for color-mix() functions that contain token references
    const colorMixTokenMatch = trimmed.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)[^)]*\)/i)
    if (colorMixTokenMatch) {
      return trimmed
    }
    
    // If it's a var() reference, extract the inner variable name and recurse
    const varMatch = trimmed.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
    if (varMatch) {
      const innerVarName = varMatch[1].trim()
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
      // Extract palette name and level from var() reference
      // Try with current mode first, then fallback to any mode
      const modeLower = mode.toLowerCase()
      
      // First check for core colors
      // Core colors can be: core-black, core-white, core-alert-tone, core-warning-tone, core-success-tone, core-interactive-default-tone, etc.
      let coreMatch = paletteValue.match(new RegExp(`var\\s*\\(\\s*--recursica-brand-themes-${modeLower}-palettes-core-([a-z0-9-]+(?:-tone|-default-tone|-hover-tone)?)\\s*\\)`, 'i'))
      if (!coreMatch) {
        coreMatch = paletteValue.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone|-default-tone|-hover-tone)?)\s*\)/i)
      }
      
      if (coreMatch) {
        const [, coreKey] = coreMatch
        // Handle interactive colors
        if (coreKey === 'interactive-default-tone' || coreKey === 'interactive-default') {
          return 'Core / Interactive / Default'
        }
        if (coreKey === 'interactive-hover-tone' || coreKey === 'interactive-hover') {
          return 'Core / Interactive / Hover'
        }
        if (coreKey === 'interactive' || coreKey === 'interactive-tone') {
          return 'Core / Interactive'
        }
        // Handle other core colors (black, white, alert-tone, warning-tone, success-tone)
        // Remove -tone suffix if present for display
        const coreName = coreKey.replace(/-tone$/, '')
        const formattedCore = formatPaletteName(coreName)
        return `Core / ${formattedCore}`
      }
      
      let match = paletteValue.match(new RegExp(`var\\s*\\(\\s*--recursica-brand-themes-${modeLower}-palettes-([a-z0-9-]+)-(\\d+|000|1000|primary|default|hover)-tone\\s*\\)`, 'i'))
      
      if (!match) {
        match = paletteValue.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary|default|hover)-tone\s*\)/i)
      }
      
      if (match) {
        const [, paletteKey, level] = match
        
        // Special handling for core-interactive palette
        if (paletteKey === 'core-interactive') {
          if (level === 'default') {
            return 'Core / Interactive / Default'
          } else if (level === 'hover') {
            return 'Core / Interactive / Hover'
          } else {
            return `Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`
          }
        }
        
        const formattedPalette = formatPaletteName(paletteKey)
        // Don't show "default" level - it's implied (except for core-interactive which we handle above)
        if (level === 'default') {
          return formattedPalette
        }
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
            const coreCssVar = `--recursica-brand-themes-${modeLower}-palettes-core-${coreKey}`
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
    
    // Extract palette name and level from var() reference
    // Match: var(--recursica-brand-themes-{light|dark}-palettes-{paletteKey}-{level}-tone)
    // Try with current mode first, then fallback to any mode
    const modeLower = mode.toLowerCase()
    
    // Debug: log the cssValue to see what we're matching against
    if (cssValue && displayCssVar && (displayCssVar.includes('background') || displayCssVar.includes('Background'))) {
      console.log('[PaletteColorControl] Matching cssValue:', cssValue, 'for displayCssVar:', displayCssVar)
    }
    
    let match = cssValue.match(new RegExp(`var\\s*\\(\\s*--recursica-brand-themes-${modeLower}-palettes-([a-z0-9-]+)-(\\d+|000|1000|primary|default|hover)-tone\\s*\\)`, 'i'))
    
    // If no match with current mode, try any mode
    if (!match) {
      match = cssValue.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary|default|hover)-tone\s*\)/i)
    }
    
    // Also check for color-mix() functions that contain palette references
    // Match: color-mix(in srgb, var(--recursica-brand-themes-{light|dark}-palettes-{paletteKey}-{level}-tone) ...)
    // The palette var can appear anywhere in the color-mix function
    if (!match) {
      match = cssValue.match(new RegExp(`color-mix\\s*\\([^)]*var\\s*\\(\\s*--recursica-brand-themes-${modeLower}-palettes-([a-z0-9-]+)-(\\d+|000|1000|primary|default|hover)-tone\\s*\\)[^)]*\\)`, 'i'))
    }
    
    if (!match) {
      match = cssValue.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary|default|hover)-tone\s*\)[^)]*\)/i)
    }
    
    // Also check for token references: var(--recursica-tokens-color-{family}-{level})
    // Match: var(--recursica-tokens-color-{family}-{level})
    let tokenMatch = cssValue.match(/var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)/i)
    
    // Also check for color-mix() functions that contain token references
    if (!tokenMatch) {
      tokenMatch = cssValue.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)[^)]*\)/i)
    }
    
    if (match) {
      const [, paletteKey, level] = match
      
      // Special handling for core-interactive palette
      if (paletteKey === 'core-interactive') {
        if (level === 'default') {
          return 'Core / Interactive / Default'
        } else if (level === 'hover') {
          return 'Core / Interactive / Hover'
        } else {
          return `Core / Interactive / ${level.charAt(0).toUpperCase() + level.slice(1)}`
        }
      }
      
      const formattedPalette = formatPaletteName(paletteKey)
      // Don't show "default" level - it's implied
      if (level === 'default') {
        return formattedPalette
      }
      const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
      return `${formattedPalette} / ${displayLevel}`
    }
    
    if (tokenMatch) {
      const [, family, level] = tokenMatch
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
          const coreCssVar = `--recursica-brand-themes-${modeLower}-palettes-core-${coreKey}`
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
      // Extract palette name and level from var() reference
      // Try with current mode first, then fallback to any mode
      const modeLower = mode.toLowerCase()
      
      // PRIORITY 1: Check for core colors FIRST
      let coreMatch = paletteValue.match(new RegExp(`var\\s*\\(\\s*--recursica-brand-themes-${modeLower}-palettes-core-([a-z0-9-]+(?:-tone)?)\\s*\\)`, 'i'))
      if (!coreMatch) {
        coreMatch = paletteValue.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone)?)\s*\)/i)
      }
      
      if (coreMatch) {
        const [, coreKey] = coreMatch
        // Handle interactive colors
        if (coreKey === 'interactive-default-tone' || coreKey === 'interactive-default') {
          setDisplayLabel('Core / Interactive / Default')
          return
        }
        if (coreKey === 'interactive-hover-tone' || coreKey === 'interactive-hover') {
          setDisplayLabel('Core / Interactive / Hover')
          return
        }
        if (coreKey === 'interactive' || coreKey === 'interactive-tone') {
          setDisplayLabel('Core / Interactive')
          return
        }
        // Handle other core colors
        const formattedCore = formatPaletteName(coreKey.replace(/-tone$/, ''))
        setDisplayLabel(`Core / ${formattedCore}`)
        return
      }
      
      // PRIORITY 2: Check for regular palettes
      let match = paletteValue.match(new RegExp(`var\\s*\\(\\s*--recursica-brand-themes-${modeLower}-palettes-([a-z0-9-]+)-(\\d+|000|1000|primary|default|hover)-tone\\s*\\)`, 'i'))
      
      if (!match) {
        match = paletteValue.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary|default|hover)-tone\s*\)/i)
      }
      
      if (match) {
        const [, paletteKey, level] = match
        
        // Special handling for core-interactive palette
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
        // Don't show "default" level - it's implied (except for core-interactive which we handle above)
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
            const coreCssVar = `--recursica-brand-themes-${modeLower}-palettes-core-${coreKey}`
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

    // Extract palette name and level from var() reference
    // Match: var(--recursica-brand-themes-{light|dark}-palettes-{paletteKey}-{level}-tone)
    // Updated regex to handle 000 and 1000 levels
    // Try with current mode first, then fallback to any mode
    const modeLower = mode.toLowerCase()
    let match = cssValue.match(new RegExp(`var\\s*\\(\\s*--recursica-brand-themes-${modeLower}-palettes-([a-z0-9-]+)-(\\d+|000|1000|primary|default|hover)-tone\\s*\\)`, 'i'))
    
    // If no match with current mode, try any mode
    if (!match) {
      match = cssValue.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary|default|hover)-tone\s*\)/i)
    }
    
    // Also check for color-mix() functions that contain palette references
    // Match: color-mix(in srgb, var(--recursica-brand-themes-{light|dark}-palettes-{paletteKey}-{level}-tone) ...)
    // The palette var can appear anywhere in the color-mix function
    if (!match) {
      match = cssValue.match(new RegExp(`color-mix\\s*\\([^)]*var\\s*\\(\\s*--recursica-brand-themes-${modeLower}-palettes-([a-z0-9-]+)-(\\d+|000|1000|primary|default|hover)-tone\\s*\\)[^)]*\\)`, 'i'))
    }
    
    if (!match) {
      match = cssValue.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary|default|hover)-tone\s*\)[^)]*\)/i)
    }
    
    // Also check for token references: var(--recursica-tokens-color-{family}-{level})
    // Match: var(--recursica-tokens-color-{family}-{level})
    let tokenMatch = cssValue.match(/var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)/i)
    
    // Also check for color-mix() functions that contain token references
    if (!tokenMatch) {
      tokenMatch = cssValue.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)[^)]*\)/i)
    }
    
    if (match) {
      const [, paletteKey, level] = match
      
      // Special handling for core-interactive palette
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
      // Don't show "default" level - it's implied
      if (level === 'default') {
        setDisplayLabel(formattedPalette)
      } else {
        const displayLevel = level === 'primary' ? 'primary' : level === 'hover' ? 'Hover' : level
        setDisplayLabel(`${formattedPalette} / ${displayLevel}`)
      }
      return
    }
    
    if (tokenMatch) {
      const [, family, level] = tokenMatch
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

  const handleClick = () => {
    const el = buttonRef.current
    if (!el) return
    try {
      // If multiple CSS vars are provided, pass them all to the picker
      const cssVarsToUpdate = targetCssVars && targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      ;(window as any).openPalettePicker(el, targetCssVar, cssVarsToUpdate)
    } catch (err) {
      console.error('Failed to open palette picker:', err)
    }
  }

  return (
    <>
      {label && (
        <label className="palette-color-control-label">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="palette-color-control"
        style={{
          fontSize,
        }}
      >
        <span
          aria-hidden
          className="palette-color-control-swatch"
          style={{
            width: swatchSize,
            height: swatchSize,
          }}
        >
          <span
            className="palette-color-control-swatch-inner"
            style={{
              background: `var(${displayCssVar}, transparent)`,
            }}
          />
        </span>
        <span className="palette-color-control-text" style={{ fontSize }}>
          {displayLabel}
        </span>
        {contrastWarning && (
          <span
            className="palette-color-control-warning"
            title={`Poor contrast: ${contrastWarning.ratio}:1 (WCAG AA requires 4.5:1)`}
            aria-label={`Poor contrast warning: ${contrastWarning.ratio}:1 ratio`}
          >
            ⚠
          </span>
        )}
      </button>
      <PaletteSwatchPicker 
        onSelect={() => {
          // Force re-read of CSS variable when a selection is made
          setRefreshKey(prev => prev + 1)
        }}
      />
    </>
  )
}

