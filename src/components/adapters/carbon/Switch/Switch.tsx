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
  
  // Use getComponentCssVar to build CSS var names - matches what toolbar uses
  const thumbVar = getComponentCssVar('Switch', 'color', `${colorVariant}-thumb`, layer)
  const trackSelectedVar = getComponentCssVar('Switch', 'color', `${colorVariant}-track-selected`, layer)
  const trackUnselectedVar = getComponentCssVar('Switch', 'color', `${colorVariant}-track-unselected`, layer)
  const borderRadiusVar = getComponentCssVar('Switch', 'size', 'border-radius', undefined)
  const elevationVar = getComponentCssVar('Switch', 'size', 'elevation', undefined)
  
  // Use CSS variables directly - they already point to the correct layer-specific values from UIKit.json
  const thumbColor = `var(${thumbVar})`
  const trackSelectedColor = `var(${trackSelectedVar})`
  const trackUnselectedColor = `var(${trackUnselectedVar})`
  const borderRadiusValue = `var(${borderRadiusVar})`
  
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
        '--recursica-toggle-thumb-bg': thumbColor,
        '--recursica-toggle-track-checked': trackSelectedColor,
        '--recursica-toggle-track-unchecked': trackUnselectedColor,
        '--recursica-toggle-border-radius': borderRadiusValue,
        '--recursica-toggle-elevation': elevationBoxShadow || 'none',
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

