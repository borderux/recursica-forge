import React, { useRef, useState, useEffect } from 'react'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'

type PaletteColorControlProps = {
  /** The CSS variable name to set when a color is selected */
  targetCssVar: string
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
  label,
  currentValueCssVar,
  fallbackLabel = 'Not set',
  swatchSize = 16,
  fontSize = 13,
}: PaletteColorControlProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [displayLabel, setDisplayLabel] = useState<string>(fallbackLabel)

  const displayCssVar = currentValueCssVar || targetCssVar

  // Update display label when CSS variable changes
  useEffect(() => {
    const updateLabel = () => {
      try {
        const computedValue = getComputedStyle(document.documentElement)
          .getPropertyValue(displayCssVar)
          .trim()
        
        if (!computedValue) {
          setDisplayLabel(fallbackLabel)
          return
        }

        // Check if it's a var() reference to a palette
        const varMatch = computedValue.match(/var\((--recursica-brand-light-palettes-([a-z0-9-]+)-(\d+|primary)-tone)\)/)
        if (varMatch) {
          const [, , paletteKey, level] = varMatch
          const normalizedLevel = level === 'primary' ? 'default' : level
          setDisplayLabel(`${paletteKey}/${normalizedLevel}`)
          return
        }

        // If it's a direct color value, return a generic label
        if (computedValue.startsWith('#') || computedValue.startsWith('rgb')) {
          setDisplayLabel('Custom color')
          return
        }

        setDisplayLabel(fallbackLabel)
      } catch {
        setDisplayLabel(fallbackLabel)
      }
    }

    updateLabel()

    // Listen for CSS variable changes (via custom events or polling)
    const interval = setInterval(updateLabel, 100)
    const handlePaletteChange = () => updateLabel()
    
    try {
      window.addEventListener('paletteVarsChanged', handlePaletteChange)
    } catch {}

    return () => {
      clearInterval(interval)
      try {
        window.removeEventListener('paletteVarsChanged', handlePaletteChange)
      } catch {}
    }
  }, [displayCssVar, fallbackLabel])

  const handleClick = () => {
    const el = buttonRef.current
    if (!el) return
    try {
      (window as any).openPalettePicker(el, targetCssVar)
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

