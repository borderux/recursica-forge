/**
 * Switch Component Adapter
 * 
 * Unified Switch component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'
import { toCssVarName, getComponentCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  layer?: ComponentLayer
  colorVariant?: string
  sizeVariant?: string
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  alternativeLayer?: string | null // e.g., "high-contrast", "none", null
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Switch({
  checked,
  onChange,
  disabled = false,
  layer = 'layer-0',
  colorVariant = 'default',
  sizeVariant = 'default',
  elevation,
  alternativeLayer,
  className,
  style,
  mantine,
  material,
  carbon,
}: SwitchProps) {
  const Component = useComponent('Switch')
  
  if (!Component) {
    // Fallback to our custom Switch implementation
    const { mode } = useThemeMode()
    
    // Build UIKit CSS var names - these already include the layer in the path
    // e.g., --recursica-ui-kit-components-switch-color-layer-0-variant-default-thumb
    const thumbVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'thumb'].join('.'))
    const trackSelectedVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-selected'].join('.'))
    const trackUnselectedVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-unselected'].join('.'))
    const borderRadiusVar = toCssVarName(['components', 'switch', 'size', 'variant', sizeVariant, 'border-radius'].join('.'))
    const elevationVar = getComponentCssVar('Switch', 'size', 'elevation', undefined)
    
    // Check if component has alternative-layer prop set (overrides layer-based alt layer)
    const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
    
    // Determine elevation to apply - prioritize prop, then UIKit.json, then alt layer
    const elevationBoxShadow = (() => {
      let elevationToApply: string | undefined = elevation
      
      // First, check if UIKit.json has an elevation set
      if (!elevationToApply && elevationVar) {
        const uikitElevation = readCssVar(elevationVar)
        if (uikitElevation) {
          // Parse elevation value - could be a brand reference like "{brand.themes.light.elevations.elevation-4}"
          const match = uikitElevation.match(/elevations\.(elevation-\d+)/)
          if (match) {
            elevationToApply = match[1]
          } else if (/^elevation-\d+$/.test(uikitElevation)) {
            elevationToApply = uikitElevation
          }
        }
      }
      
      // Check alt layer elevation if alt-layer is set
      if (hasComponentAlternativeLayer) {
        // Read elevation from alt layer's property
        const altLayerElevationVar = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property-elevation`
        const altLayerElevation = readCssVar(altLayerElevationVar)
        if (altLayerElevation) {
          // Parse elevation value - could be a brand reference like "{brand.themes.light.elevations.elevation-4}"
          const match = altLayerElevation.match(/elevations\.(elevation-\d+)/)
          if (match) {
            elevationToApply = match[1]
          } else if (/^elevation-\d+$/.test(altLayerElevation)) {
            elevationToApply = altLayerElevation
          }
        }
        // If alt layer doesn't have elevation, fall back to component-level elevation
        if (!elevationToApply) {
          elevationToApply = elevation
        }
      }
      
      if (elevationToApply && elevationToApply !== 'elevation-0') {
        const elevationMatch = elevationToApply.match(/elevation-(\d+)/)
        if (elevationMatch) {
          const elevationLevel = elevationMatch[1]
          return `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
        }
      }
      return undefined
    })()
    
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={className}
        style={{
          position: 'relative',
          width: '48px',
          height: '24px',
          borderRadius: `var(${borderRadiusVar})`,
          border: 'none',
          background: checked 
            ? `var(${trackSelectedVar})` 
            : `var(${trackUnselectedVar})`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          padding: '2px',
          outline: 'none',
          ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
          ...style,
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault()
            onChange(!checked)
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: checked ? 'calc(100% - 20px - 2px)' : '2px',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            borderRadius: `var(${borderRadiusVar})`,
            background: `var(${thumbVar})`,
            zIndex: 1,
            transition: 'left 0.2s',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
        />
      </button>
    )
  }
  
  return (
    <Suspense fallback={<div style={{ width: 48, height: 24 }} />}>
      <Component
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        layer={layer}
        colorVariant={colorVariant}
        sizeVariant={sizeVariant}
        elevation={elevation}
        alternativeLayer={alternativeLayer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}

