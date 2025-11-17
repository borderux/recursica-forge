import { useRef, useState, useEffect } from 'react'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { readCssVar } from '../../core/css/readCssVar'

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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const displayCssVar = currentValueCssVar || targetCssVar
  
  // Initialize display label by reading CSS variable value immediately
  const getInitialLabel = (): string => {
    const cssValue = readCssVar(displayCssVar)
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
      const formattedFamily = family
        .replace(/[-_/]+/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase())
        .trim()
      return `${formattedFamily} / ${level}`
    }
    
    if (cssValue.startsWith('#') || cssValue.startsWith('rgb')) {
      return 'Custom color'
    }
    
    return fallbackLabel
  }
  
  const [displayLabel, setDisplayLabel] = useState<string>(getInitialLabel)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-read when picker closes

  // Helper function to format palette name (e.g., "palette-1" -> "Palette 1", "neutral" -> "Neutral")
  const formatPaletteName = (paletteKey: string): string => {
    return paletteKey
      .replace(/[-_/]+/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .trim()
  }

  // Helper function to update display label from CSS variable
  const updateDisplayLabel = () => {
    // Get the CSS variable value - readCssVar checks both inline and computed styles
    const cssValue = readCssVar(displayCssVar)

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
      {label && <label>{label}</label>}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          border: '1px solid var(--layer-layer-1-property-border-color)',
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
            border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)',
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

