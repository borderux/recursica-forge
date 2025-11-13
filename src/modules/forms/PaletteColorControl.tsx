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
  const [displayLabel, setDisplayLabel] = useState<string>(fallbackLabel)

  const displayCssVar = currentValueCssVar || targetCssVar

  // Helper function to format palette name (e.g., "palette-1" -> "Palette 1", "neutral" -> "Neutral")
  const formatPaletteName = (paletteKey: string): string => {
    return paletteKey
      .replace(/[-_/]+/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .trim()
  }

  // Update display label based on CSS variable value
  useEffect(() => {
    // Get the CSS variable value
    const cssValue = readCssVar(displayCssVar)

    if (!cssValue) {
      setDisplayLabel(fallbackLabel)
      return
    }

    // Extract palette name and level from var() reference
    // Match: var(--recursica-brand-{light|dark}-palettes-{paletteKey}-{level}-tone)
    const match = cssValue.match(/var\s*\(\s*--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary)-tone\s*\)/)
    if (match) {
      const [, paletteKey, level] = match
      const formattedPalette = formatPaletteName(paletteKey)
      const displayLevel = level === 'primary' ? 'primary' : level
      setDisplayLabel(`${formattedPalette} / ${displayLevel}`)
      return
    }

    // If it's a direct color value
    if (cssValue.startsWith('#') || cssValue.startsWith('rgb')) {
      setDisplayLabel('Custom color')
      return
    }

    setDisplayLabel(fallbackLabel)
  }, [displayCssVar, fallbackLabel])

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
          border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))',
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
            border: '1px solid rgba(0,0,0,0.15)',
            background: `var(${displayCssVar}, transparent)`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize, textTransform: 'capitalize' }}>
          {displayLabel}
        </span>
      </button>
      <PaletteSwatchPicker />
    </>
  )
}

