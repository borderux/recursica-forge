import { useRef, useState, useEffect, useMemo } from 'react'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'

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
}: PaletteColorControlProps) {
  const { palettes, theme: themeJson } = useVars()
  const { mode } = useThemeMode()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const displayCssVar = currentValueCssVar || targetCssVar
  
  // Get available palette keys and levels for token-to-palette mapping
  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    const staticPalettes: string[] = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const lightPal: any = root?.light?.palettes || {}
      Object.keys(lightPal).forEach((k) => {
        if (k !== 'core' && k !== 'core-colors' && !dynamic.includes(k)) {
          staticPalettes.push(k)
        }
      })
    } catch {}
    return Array.from(new Set([...dynamic, ...staticPalettes]))
  }, [palettes, themeJson])
  
  const paletteLevels = useMemo(() => {
    const levelsByPalette: Record<string, string[]> = {}
    paletteKeys.forEach((pk) => {
      try {
        const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
        const paletteData: any = root?.light?.palettes?.[pk]
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
  }, [paletteKeys, themeJson])
  
  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    return `--recursica-brand-light-palettes-${paletteKey}-${level}-tone`
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
    
    // Check if this value directly contains a palette reference
    const paletteMatch = trimmed.match(/var\s*\(\s*--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary)-tone\s*\)/)
    if (paletteMatch) {
      return trimmed
    }
    
    // Check if this value directly contains a token reference
    const tokenMatch = trimmed.match(/var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)/)
    if (tokenMatch) {
      return trimmed
    }
    
    // Check for color-mix() functions that contain palette references
    const colorMixPaletteMatch = trimmed.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary)-tone\s*\)[^)]*\)/)
    if (colorMixPaletteMatch) {
      return trimmed
    }
    
    // Check for color-mix() functions that contain token references
    const colorMixTokenMatch = trimmed.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)[^)]*\)/)
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
  
  // Initialize display label by reading CSS variable value immediately
  const getInitialLabel = (): string => {
    // First try to find palette reference in the CSS variable chain
    let paletteValue = findPaletteInChain(displayCssVar)
    let cssValue = paletteValue || readCssVar(displayCssVar)
    
    // If we didn't find a palette reference in the chain, try resolving to hex and matching
    if (!paletteValue && cssValue) {
      const resolvedHex = readCssVarResolved(displayCssVar, 5)
      if (resolvedHex && /^#[0-9a-f]{6}$/i.test(resolvedHex.trim())) {
        // Try to find which palette this hex matches
        for (const pk of paletteKeys) {
          const levels = paletteLevels[pk] || []
          for (const level of levels) {
            const paletteCssVar = buildPaletteCssVar(pk, level)
            const paletteHex = readCssVarResolved(paletteCssVar, 5)
            if (paletteHex && paletteHex.trim().toLowerCase() === resolvedHex.trim().toLowerCase()) {
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
    
    if (!cssValue) return fallbackLabel
    
    // Extract palette name and level from var() reference
    // Match: var(--recursica-brand-{light|dark}-palettes-{paletteKey}-{level}-tone)
    let match = cssValue.match(/var\s*\(\s*--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary)-tone\s*\)/)
    
    // Also check for color-mix() functions that contain palette references
    // Match: color-mix(in srgb, var(--recursica-brand-{light|dark}-palettes-{paletteKey}-{level}-tone) ...)
    // The palette var can appear anywhere in the color-mix function
    if (!match) {
      match = cssValue.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary)-tone\s*\)[^)]*\)/)
    }
    
    // Also check for token references: var(--recursica-tokens-color-{family}-{level})
    // Match: var(--recursica-tokens-color-{family}-{level})
    let tokenMatch = cssValue.match(/var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)/)
    
    // Also check for color-mix() functions that contain token references
    if (!tokenMatch) {
      tokenMatch = cssValue.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)[^)]*\)/)
    }
    
    if (match) {
      const [, paletteKey, level] = match
      const formattedPalette = paletteKey
        .replace(/[-_/]+/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase())
        .trim()
      const displayLevel = level === 'primary' ? 'primary' : level
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
    
    return fallbackLabel
  }
  
  const [displayLabel, setDisplayLabel] = useState<string>(getInitialLabel)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-read when picker closes

  // Helper function to update display label from CSS variable
  const updateDisplayLabel = () => {
    // First try to find palette reference in the CSS variable chain
    let paletteValue = findPaletteInChain(displayCssVar)
    let cssValue = paletteValue || readCssVar(displayCssVar)
    
    // If we didn't find a palette reference in the chain, try resolving to hex and matching
    if (!paletteValue && cssValue) {
      const resolvedHex = readCssVarResolved(displayCssVar, 5)
      if (resolvedHex && /^#[0-9a-f]{6}$/i.test(resolvedHex.trim())) {
        // Try to find which palette this hex matches
        for (const pk of paletteKeys) {
          const levels = paletteLevels[pk] || []
          for (const level of levels) {
            const paletteCssVar = buildPaletteCssVar(pk, level)
            const paletteHex = readCssVarResolved(paletteCssVar, 5)
            if (paletteHex && paletteHex.trim().toLowerCase() === resolvedHex.trim().toLowerCase()) {
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

    if (!cssValue) {
      setDisplayLabel(fallbackLabel)
      return
    }

    // Extract palette name and level from var() reference
    // Match: var(--recursica-brand-{light|dark}-palettes-{paletteKey}-{level}-tone)
    // Updated regex to handle 000 and 1000 levels
    let match = cssValue.match(/var\s*\(\s*--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary)-tone\s*\)/)
    
    // Also check for color-mix() functions that contain palette references
    // Match: color-mix(in srgb, var(--recursica-brand-{light|dark}-palettes-{paletteKey}-{level}-tone) ...)
    // The palette var can appear anywhere in the color-mix function
    if (!match) {
      match = cssValue.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|000|1000|primary)-tone\s*\)[^)]*\)/)
    }
    
    // Also check for token references: var(--recursica-tokens-color-{family}-{level})
    // Match: var(--recursica-tokens-color-{family}-{level})
    let tokenMatch = cssValue.match(/var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)/)
    
    // Also check for color-mix() functions that contain token references
    if (!tokenMatch) {
      tokenMatch = cssValue.match(/color-mix\s*\([^)]*var\s*\(\s*--recursica-tokens-color-([a-z0-9-]+)-(\d+|000|1000|050)\s*\)[^)]*\)/)
    }
    
    if (match) {
      const [, paletteKey, level] = match
      const formattedPalette = formatPaletteName(paletteKey)
      const displayLevel = level === 'primary' ? 'primary' : level
      setDisplayLabel(`${formattedPalette} / ${displayLevel}`)
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

    setDisplayLabel(fallbackLabel)
  }

  // Update display label based on CSS variable value
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
  }, [displayCssVar, fallbackLabel, refreshKey]) // Include refreshKey to force re-read

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
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          border: `var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-thickness) solid var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-color)`,
          background: 'transparent',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden
          style={{
            width: swatchSize,
            height: swatchSize,
            borderRadius: 4,
            border: `var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-thickness) solid var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-color)`,
            background: `var(${displayCssVar}, transparent)`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize, textTransform: 'capitalize' }}>
          {displayLabel}
        </span>
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

