/**
 * Carbon Switch Implementation
 * 
 * Carbon-specific Switch component that uses CSS variables for theming.
 * Uses Carbon's Toggle component (not Switch) as per Carbon Design System.
 */

import { Toggle } from '@carbon/react'
import { useEffect, useRef } from 'react'
import type { SwitchProps as AdapterSwitchProps } from '../../Switch'
import { toCssVarName } from '../../../utils/cssVarNames'
import './Switch.css'

export default function Switch({
  checked,
  onChange,
  disabled = false,
  layer = 'layer-0',
  colorVariant = 'default',
  sizeVariant = 'default',
  className,
  style,
  carbon,
  ...props
}: AdapterSwitchProps) {
  const toggleRef = useRef<HTMLDivElement>(null)
  
  // Build UIKit CSS var names - these already include the layer in the path
  // e.g., --recursica-ui-kit-components-switch-color-layer-0-variant-default-thumb
  const thumbVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'thumb'].join('.'))
  const trackSelectedVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-selected'].join('.'))
  const trackUnselectedVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-unselected'].join('.'))
  const borderRadiusVar = toCssVarName(['components', 'switch', 'size', 'variant', sizeVariant, 'border-radius'].join('.'))
  
  // Use CSS variables directly - they already point to the correct layer-specific values from UIKit.json
  const thumbColor = `var(${thumbVar})`
  const trackSelectedColor = `var(${trackSelectedVar})`
  const trackUnselectedColor = `var(${trackUnselectedVar})`
  const borderRadiusValue = `var(${borderRadiusVar})`
  
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
      }}
    >
      <Toggle
        toggled={checked}
        onToggle={(checked) => onChange(checked)}
        disabled={disabled}
        labelText=""
        hideLabel={true}
        className={className}
        style={style}
        {...carbon}
        {...props}
      />
    </div>
  )
}

