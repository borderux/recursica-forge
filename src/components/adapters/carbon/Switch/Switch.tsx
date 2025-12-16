/**
 * Carbon Switch Implementation
 * 
 * Carbon-specific Switch component that uses CSS variables for theming.
 * Uses Carbon's Toggle component (not Switch) as per Carbon Design System.
 */

import { Toggle } from '@carbon/react'
import { useEffect, useRef } from 'react'
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
  carbon,
  ...props
}: AdapterSwitchProps) {
  const { mode } = useThemeMode()
  const toggleRef = useRef<HTMLDivElement>(null)
  
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
  
  
  // Override track-selected to use alternative layer's interactive color when alt layer is set
  if (hasComponentAlternativeLayer) {
    trackSelectedVar = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property-element-interactive-tone`
  }
  
  // Use CSS variables directly - they already point to the correct layer-specific values from UIKit.json
  const thumbSelectedColor = `var(${thumbSelectedVar})`
  const thumbUnselectedColor = `var(${thumbUnselectedVar})`
  const trackSelectedColor = `var(${trackSelectedVar})`
  const trackUnselectedColor = `var(${trackUnselectedVar})`
  const trackBorderRadiusValue = `var(${trackBorderRadiusVar})`
  
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
  
  // Prevent label from being clickable - handle clicks only on toggle elements
  useEffect(() => {
    if (!toggleRef.current) return
    
    const label = toggleRef.current.querySelector('.cds--toggle__label') as HTMLLabelElement
    if (label) {
      // Remove the 'for' attribute to break the label-input association
      const inputId = label.getAttribute('for')
      if (inputId) {
        label.removeAttribute('for')
      }
      
      // Prevent all clicks on the label itself
      const handleLabelClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        // Only allow clicks directly on the input, track, or thumb
        const isInput = target.classList.contains('cds--toggle__input') || target.closest('.cds--toggle__input')
        const isTrack = target.classList.contains('cds--toggle__track') || target.closest('.cds--toggle__track')
        const isThumb = target.classList.contains('cds--toggle__thumb') || target.closest('.cds--toggle__thumb')
        
        if (!isInput && !isTrack && !isThumb) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          return false
        }
      }
      
      // Use capture phase to intercept before Carbon's handlers
      label.addEventListener('click', handleLabelClick, true)
      label.addEventListener('mousedown', handleLabelClick, true)
      
      return () => {
        label.removeEventListener('click', handleLabelClick, true)
        label.removeEventListener('mousedown', handleLabelClick, true)
        if (inputId) {
          label.setAttribute('for', inputId)
        }
      }
    }
  }, [])
  
  
  return (
    <div
      ref={toggleRef}
      className="recursica-carbon-toggle-wrapper"
      style={{
        // Color wrapper vars (layer/variant-specific, need per-instance resolution)
        '--recursica-ui-kit-components-switch-thumb-bg-selected': thumbSelectedColor,
        '--recursica-ui-kit-components-switch-thumb-bg-unselected': thumbUnselectedColor,
        '--recursica-ui-kit-components-switch-track-checked': trackSelectedColor,
        '--recursica-ui-kit-components-switch-track-unchecked': trackUnselectedColor,
        // Component-level properties are already on :root from UIKit.json - don't create circular refs
        // Only set computed values that depend on them
        '--recursica-ui-kit-components-switch-track-height': trackHeight,
        '--recursica-ui-kit-components-switch-thumb-elevation': thumbElevationBoxShadow || 'none',
        '--recursica-ui-kit-components-switch-track-elevation': trackElevationBoxShadow || 'none',
        width: `var(${trackWidthVar})`,
        ...style,
      }}
    >
      <Toggle
        toggled={checked}
        onToggle={(checked) => onChange(checked)}
        disabled={disabled}
        labelText=""
        hideLabel={true}
        className={className}
        {...carbon}
        {...props}
      />
    </div>
  )
}

