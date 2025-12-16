/**
 * Mantine Switch Implementation
 * 
 * Mantine-specific Switch component that uses CSS variables for theming.
 */

import { Switch as MantineSwitch } from '@mantine/core'
import { useEffect, useState } from 'react'
import type { SwitchProps as AdapterSwitchProps } from '../../Switch'
import { getComponentCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
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
  const trackElevationVar = getComponentCssVar('Switch', 'size', 'track-elevation', undefined)
  
  // Force re-render when CSS vars change
  const [updateCounter, setUpdateCounter] = useState(0)
  
  useEffect(() => {
    const handleCssVarUpdate = (e: CustomEvent) => {
      const updatedVars = (e.detail as any)?.cssVars || []
      // Check if any of our CSS vars were updated (exact match or partial match for Switch-related vars)
      const allOurVars = [
        thumbSelectedVar, thumbUnselectedVar, trackSelectedVar, trackUnselectedVar,
        trackBorderRadiusVar, thumbBorderRadiusVar,
        thumbHeightVar, thumbWidthVar, trackWidthVar, trackInnerPaddingVar,
        thumbIconSizeVar, thumbIconSelectedVar, thumbIconUnselectedVar,
        thumbElevationVar, trackElevationVar,
        '--recursica-ui-kit-components-switch-thumb-bg-selected',
        '--recursica-ui-kit-components-switch-thumb-bg-unselected',
        '--recursica-ui-kit-components-switch-track-checked',
        '--recursica-ui-kit-components-switch-track-unchecked',
      ]
      if (updatedVars.some((v: string) => {
        // Exact match
        if (allOurVars.includes(v)) return true
        // Partial match for Switch color vars (thumb-selected, thumb-unselected, track-selected, track-unselected)
        if (v.includes('switch') && (
          v.includes('thumb-selected') || v.includes('thumb-unselected') ||
          v.includes('track-selected') || v.includes('track-unselected') ||
          v.includes('thumb-bg-selected') || v.includes('thumb-bg-unselected') ||
          v.includes('track-checked') || v.includes('track-unchecked')
        )) return true
        return false
      })) {
        setUpdateCounter(prev => prev + 1)
      }
    }
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
  }, [thumbSelectedVar, thumbUnselectedVar, trackSelectedVar, trackUnselectedVar, trackBorderRadiusVar, thumbBorderRadiusVar, thumbHeightVar, thumbWidthVar, trackWidthVar, trackInnerPaddingVar, thumbIconSizeVar, thumbIconSelectedVar, thumbIconUnselectedVar, thumbElevationVar, trackElevationVar])
  
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
  const trackElevationBoxShadow = (() => {
    let elevationToApply: string | undefined = elevation
    
    // First, check if UIKit.json has a track-elevation set
    if (!elevationToApply && trackElevationVar) {
      const uikitElevation = readCssVar(trackElevationVar)
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
  const trackHeight = `calc(var(${thumbHeightVar}) + 2 * var(${trackInnerPaddingVar}))`
  
  // Read resolved values for Mantine internal variables to avoid undefined references
  const thumbBorderRadiusValue = readCssVarResolved(thumbBorderRadiusVar) || readCssVar(thumbBorderRadiusVar) || '0px'
  
  // Use updateCounter to force re-render when CSS vars change (even though we don't use it in render)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = updateCounter
  
  return (
    <MantineSwitch
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      disabled={disabled}
      thumbIcon={checked ? (ThumbIconSelected ? <ThumbIconSelected style={{ width: `var(${thumbIconSizeVar})`, height: `var(${thumbIconSizeVar})` }} /> : null) : (ThumbIconUnselected ? <ThumbIconUnselected style={{ width: `var(${thumbIconSizeVar})`, height: `var(${thumbIconSizeVar})` }} /> : null)}
      className={className}
      style={{
        // Recursica CSS variables (used by our CSS overrides)
        // For color vars (layer/variant-specific), create wrapper vars that reference UIKit vars
        '--recursica-ui-kit-components-switch-thumb-bg-selected': `var(${thumbSelectedVar})`,
        '--recursica-ui-kit-components-switch-thumb-bg-unselected': `var(${thumbUnselectedVar})`,
        '--recursica-ui-kit-components-switch-track-checked': `var(${trackSelectedVar})`,
        '--recursica-ui-kit-components-switch-track-unchecked': `var(${trackUnselectedVar})`,
        // For component-level properties, don't create wrapper vars (they're already on :root from UIKit.json)
        // Just set computed values that depend on them
        '--recursica-ui-kit-components-switch-track-height': trackHeight,
        '--recursica-ui-kit-components-switch-thumb-elevation': thumbElevationBoxShadow || 'none',
        '--recursica-ui-kit-components-switch-track-elevation': trackElevationBoxShadow || 'none',
        // Override Mantine's internal CSS variables directly with UIKit variables
        '--switch-thumb-size': `var(${thumbWidthVar})`,
        '--switch-width': `var(${trackWidthVar})`,
        '--switch-track-label-padding': `var(${trackInnerPaddingVar})`,
        '--switch-radius': thumbBorderRadiusValue,
        width: `var(${trackWidthVar})`,
        ...style,
      }}
      {...mantine}
      {...props}
    />
  )
}

