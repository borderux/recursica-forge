/**
 * Carbon Switch Implementation
 * 
 * Carbon-specific Switch component that uses CSS variables for theming.
 * Uses Carbon's Toggle component (not Switch) as per Carbon Design System.
 */

import { Toggle } from '@carbon/react'
import { useEffect, useRef, useState, useId } from 'react'
import type { SwitchProps as AdapterSwitchProps } from '../../Switch'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
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
  className,
  style,
  carbon,
  ...props
}: AdapterSwitchProps) {
  const { mode } = useThemeMode()
  const toggleRef = useRef<HTMLDivElement>(null)
  const toggleId = useId()
  
  // Use getComponentCssVar to build CSS var names - matches what toolbar uses
  const thumbSelectedVar = getComponentCssVar('Switch', 'colors', `${colorVariant}-thumb-selected`, layer)
  const thumbUnselectedVar = getComponentCssVar('Switch', 'colors', `${colorVariant}-thumb-unselected`, layer)
  const trackSelectedVar = getComponentCssVar('Switch', 'colors', `${colorVariant}-track-selected`, layer)
  const trackUnselectedVar = getComponentCssVar('Switch', 'colors', `${colorVariant}-track-unselected`, layer)
  const trackBorderRadiusVar = getComponentLevelCssVar('Switch', 'track-border-radius')
  const thumbBorderRadiusVar = getComponentLevelCssVar('Switch', 'thumb-border-radius')
  const thumbHeightVar = getComponentCssVar('Switch', 'size', 'thumb-height', undefined)
  const thumbWidthVar = getComponentCssVar('Switch', 'size', 'thumb-width', undefined)
  const trackWidthVar = getComponentCssVar('Switch', 'size', 'track-width', undefined)
  const trackInnerPaddingVar = getComponentCssVar('Switch', 'size', 'track-inner-padding', undefined)
  const thumbIconSizeVar = getComponentCssVar('Switch', 'size', 'thumb-icon-size', undefined)
  const thumbIconSelectedVar = getComponentCssVar('Switch', 'size', 'thumb-icon-selected', undefined)
  const thumbIconUnselectedVar = getComponentCssVar('Switch', 'size', 'thumb-icon-unselected', undefined)
  const thumbElevationVar = getComponentCssVar('Switch', 'size', 'thumb-elevation', undefined)
  const trackElevationVar = getComponentCssVar('Switch', 'size', 'track-elevation', undefined)
  
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
  
  // Reactively read thumb and track elevation from CSS variables
  const [thumbElevationFromVar, setThumbElevationFromVar] = useState<string | undefined>(() => {
    if (!thumbElevationVar) return undefined
    const value = readCssVar(thumbElevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  const [trackElevationFromVar, setTrackElevationFromVar] = useState<string | undefined>(() => {
    if (!trackElevationVar) return undefined
    const value = readCssVar(trackElevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update if these CSS vars were updated or if no specific vars were specified
      if (!detail?.cssVars || detail.cssVars.includes(thumbElevationVar) || detail.cssVars.includes(trackElevationVar)) {
        if (thumbElevationVar) {
          const value = readCssVar(thumbElevationVar)
          setThumbElevationFromVar(value ? parseElevationValue(value) : undefined)
        }
        if (trackElevationVar) {
          const value = readCssVar(trackElevationVar)
          setTrackElevationFromVar(value ? parseElevationValue(value) : undefined)
        }
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      if (thumbElevationVar) {
        const value = readCssVar(thumbElevationVar)
        setThumbElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
      if (trackElevationVar) {
        const value = readCssVar(trackElevationVar)
        setTrackElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [thumbElevationVar, trackElevationVar])
  
  // Determine track elevation to apply - prioritize prop, then UIKit.json
  const trackElevationBoxShadow = getElevationBoxShadow(mode, elevation ?? trackElevationFromVar)
  
  // Determine thumb elevation from UIKit.json
  const thumbElevationBoxShadow = getElevationBoxShadow(mode, thumbElevationFromVar)
  
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
        ['--recursica-ui-kit-components-switch-thumb-bg-selected' as string]: thumbSelectedColor,
        ['--recursica-ui-kit-components-switch-thumb-bg-unselected' as string]: thumbUnselectedColor,
        ['--recursica-ui-kit-components-switch-track-checked' as string]: trackSelectedColor,
        ['--recursica-ui-kit-components-switch-track-unchecked' as string]: trackUnselectedColor,
        // Component-level properties are already on :root from UIKit.json - don't create circular refs
        // Only set computed values that depend on them
        ['--recursica-ui-kit-components-switch-track-height' as string]: trackHeight, // Calculated: thumb-height + 2 * track-inner-padding
        ['--recursica-ui-kit-components-switch-thumb-elevation' as string]: thumbElevationBoxShadow || 'none',
        ['--recursica-ui-kit-components-switch-track-elevation' as string]: trackElevationBoxShadow || 'none',
        width: `var(${trackWidthVar})`,
        ...style,
      } as React.CSSProperties}
    >
      <Toggle
        id={toggleId}
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

