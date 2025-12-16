/**
 * Mantine Switch Implementation
 * 
 * Mantine-specific Switch component that uses CSS variables for theming.
 */

import { Switch as MantineSwitch } from '@mantine/core'
import type { SwitchProps as AdapterSwitchProps } from '../../Switch'
import { getComponentCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Switch.css'

export default function Switch({
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
  ...props
}: AdapterSwitchProps) {
  const { mode } = useThemeMode()
  
  // Check if component has alternative-layer prop set (overrides layer-based alt layer)
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  
  // Use getComponentCssVar to build CSS var names - matches what toolbar uses
  const thumbSelectedVar = getComponentCssVar('Switch', 'color', `${colorVariant}-thumb-selected`, layer)
  const thumbUnselectedVar = getComponentCssVar('Switch', 'color', `${colorVariant}-thumb-unselected`, layer)
  let trackSelectedVar = getComponentCssVar('Switch', 'color', `${colorVariant}-track-selected`, layer)
  const trackUnselectedVar = getComponentCssVar('Switch', 'color', `${colorVariant}-track-unselected`, layer)
  const trackBorderRadiusVar = getComponentCssVar('Switch', 'size', 'track-border-radius', undefined)
  const thumbBorderRadiusVar = getComponentCssVar('Switch', 'size', 'thumb-border-radius', undefined)
  const thumbHeightVar = getComponentCssVar('Switch', 'size', 'thumb-height', undefined)
  const thumbWidthVar = getComponentCssVar('Switch', 'size', 'thumb-width', undefined)
  const trackWidthVar = getComponentCssVar('Switch', 'size', 'track-width', undefined)
  const trackInnerPaddingVar = getComponentCssVar('Switch', 'size', 'track-inner-padding', undefined)
  const thumbIconSizeVar = getComponentCssVar('Switch', 'size', 'thumb-icon-size', undefined)
  const thumbIconSelectedVar = getComponentCssVar('Switch', 'size', 'thumb-icon-selected', undefined)
  const thumbIconUnselectedVar = getComponentCssVar('Switch', 'size', 'thumb-icon-unselected', undefined)
  const thumbElevationVar = getComponentCssVar('Switch', 'size', 'thumb-elevation', undefined)
  const elevationVar = getComponentCssVar('Switch', 'size', 'elevation', undefined)
  
  // Override track-selected to use alternative layer's interactive color when alt layer is set
  if (hasComponentAlternativeLayer) {
    trackSelectedVar = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property-element-interactive-tone`
  }
  
  // Get icon names from CSS variables
  const thumbIconSelectedName = readCssVar(thumbIconSelectedVar) || ''
  const thumbIconUnselectedName = readCssVar(thumbIconUnselectedVar) || ''
  const ThumbIconSelected = thumbIconSelectedName ? iconNameToReactComponent(thumbIconSelectedName) : null
  const ThumbIconUnselected = thumbIconUnselectedName ? iconNameToReactComponent(thumbIconUnselectedName) : null
  
  // Helper function to get elevation box shadow from elevation value
  const getElevationBoxShadow = (elevationValue: string | undefined): string | undefined => {
    if (!elevationValue || elevationValue === 'elevation-0') return undefined
    
    const elevationMatch = elevationValue.match(/elevation-(\d+)/)
    if (elevationMatch) {
      const elevationLevel = elevationMatch[1]
      return `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
    }
    return undefined
  }
  
  // Determine track elevation to apply - prioritize prop, then UIKit.json, then alt layer
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
    
    return getElevationBoxShadow(elevationToApply)
  })()
  
  // Determine thumb elevation from UIKit.json
  const thumbElevationBoxShadow = (() => {
    if (!thumbElevationVar) return undefined
    
    const thumbElevation = readCssVar(thumbElevationVar)
    if (thumbElevation) {
      // Parse elevation value - could be a brand reference like "{brand.themes.light.elevations.elevation-4}"
      const match = thumbElevation.match(/elevations\.(elevation-\d+)/)
      if (match) {
        return getElevationBoxShadow(match[1])
      } else if (/^elevation-\d+$/.test(thumbElevation)) {
        return getElevationBoxShadow(thumbElevation)
      }
    }
    return undefined
  })()
  
  // Calculate track height: thumb height + 2 * track inner padding
  const trackHeight = `calc(var(${thumbHeightVar}, 20px) + 2 * var(${trackInnerPaddingVar}, 8px))`
  
  return (
    <MantineSwitch
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      disabled={disabled}
      thumbIcon={checked ? (ThumbIconSelected ? <ThumbIconSelected style={{ width: `var(${thumbIconSizeVar}, 12px)`, height: `var(${thumbIconSizeVar}, 12px)` }} /> : null) : (ThumbIconUnselected ? <ThumbIconUnselected style={{ width: `var(${thumbIconSizeVar}, 12px)`, height: `var(${thumbIconSizeVar}, 12px)` }} /> : null)}
      className={className}
      style={{
        '--switch-thumb-bg-selected': `var(${thumbSelectedVar})`,
        '--switch-thumb-bg-unselected': `var(${thumbUnselectedVar})`,
        '--switch-track-checked': `var(${trackSelectedVar})`,
        '--switch-track-unchecked': `var(${trackUnselectedVar})`,
        '--switch-track-border-radius': `var(${trackBorderRadiusVar})`,
        '--switch-thumb-border-radius': `var(${thumbBorderRadiusVar})`,
        '--switch-thumb-height': `var(${thumbHeightVar}, 20px)`,
        '--switch-thumb-width': `var(${thumbWidthVar}, 20px)`,
        '--switch-track-width': `var(${trackWidthVar}, 48px)`,
        '--switch-track-height': trackHeight,
        '--switch-track-inner-padding': `var(${trackInnerPaddingVar}, 8px)`,
        '--switch-thumb-icon-size': `var(${thumbIconSizeVar}, 12px)`,
        '--switch-thumb-elevation': thumbElevationBoxShadow || 'none',
        '--switch-elevation': elevationBoxShadow || 'none',
        width: `var(${trackWidthVar}, 48px)`,
        ...style,
      }}
      {...mantine}
      {...props}
    />
  )
}

