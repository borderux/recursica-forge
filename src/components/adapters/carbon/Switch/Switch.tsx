/**
 * Carbon Switch Implementation
 * 
 * Carbon-specific Switch component that uses CSS variables for theming.
 * Uses Carbon's Toggle component (not Switch) as per Carbon Design System.
 */

import { Toggle } from '@carbon/react'
import { useEffect, useRef, useState, useId } from 'react'
import type { SwitchProps as AdapterSwitchProps } from '../../Switch'
import { getComponentLevelCssVar , buildComponentCssVarPath } from '../../../utils/cssVarNames'
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
  const [updateKey, setUpdateKey] = useState(0)
  const toggleRef = useRef<HTMLDivElement>(null)
  const toggleId = useId()
  
  // Force re-render when mode changes to update CSS variable references
  useEffect(() => {
    setUpdateKey(prev => prev + 1)
  }, [mode])
  
  // Use getComponentCssVar to build CSS var names - matches what toolbar uses
  const thumbSelectedVar = buildComponentCssVarPath('Switch', 'variants', 'styles', colorVariant, 'properties', 'colors', layer, 'thumb-selected')
  const thumbUnselectedVar = buildComponentCssVarPath('Switch', 'variants', 'styles', colorVariant, 'properties', 'colors', layer, 'thumb-unselected')
  const trackSelectedVar = buildComponentCssVarPath('Switch', 'variants', 'styles', colorVariant, 'properties', 'colors', layer, 'track-selected')
  const trackUnselectedVar = buildComponentCssVarPath('Switch', 'variants', 'styles', colorVariant, 'properties', 'colors', layer, 'track-unselected')
  const trackBorderRadiusVar = getComponentLevelCssVar('Switch', 'track-border-radius')
  const thumbBorderRadiusVar = getComponentLevelCssVar('Switch', 'thumb-border-radius')
  const thumbHeightVar = buildComponentCssVarPath('Switch', 'properties', 'thumb-height')
  const thumbWidthVar = buildComponentCssVarPath('Switch', 'properties', 'thumb-width')
  const trackWidthVar = buildComponentCssVarPath('Switch', 'properties', 'track-width')
  const trackInnerPaddingVar = buildComponentCssVarPath('Switch', 'properties', 'track-inner-padding')
  const thumbIconSizeVar = buildComponentCssVarPath('Switch', 'properties', 'thumb-icon-size')
  // Hardcode checkmark and x-mark for switch thumb state (as requested by user)
  const ThumbIconSelected = iconNameToReactComponent('check')
  const ThumbIconUnselected = iconNameToReactComponent('x-mark')

  const thumbElevationVar = buildComponentCssVarPath('Switch', 'properties', 'thumb-elevation')
  const trackElevationVar = buildComponentCssVarPath('Switch', 'properties', 'track-elevation')
  
  // Use CSS variables directly - they already point to the correct layer-specific values from recursica_ui-kit.json
  const thumbSelectedColor = `var(${thumbSelectedVar})`
  const thumbUnselectedColor = `var(${thumbUnselectedVar})`
  const trackSelectedColor = `var(${trackSelectedVar})`
  const trackUnselectedColor = `var(${trackUnselectedVar})`
  const trackBorderRadiusValue = `var(${trackBorderRadiusVar})`
  
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
  
  // Determine track elevation to apply - prioritize prop, then recursica_ui-kit.json
  const trackElevationBoxShadow = getElevationBoxShadow(mode, elevation ?? trackElevationFromVar)
  
  // Determine thumb elevation from recursica_ui-kit.json
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
      key={`switch-${mode}-${updateKey}`}
      ref={toggleRef}
      className="recursica-carbon-toggle-wrapper"
      style={{
        // Short local custom properties — the CSS file targets these for Carbon Toggle overrides
        '--switch-thumb-selected': thumbSelectedColor,
        '--switch-thumb-unselected': thumbUnselectedColor,
        '--switch-track-selected': trackSelectedColor,
        '--switch-track-unselected': trackUnselectedColor,
        '--switch-track-height': trackHeight,
        '--switch-thumb-elevation': thumbElevationBoxShadow || 'none',
        '--switch-track-elevation': trackElevationBoxShadow || 'none',
        '--switch-track-width': `var(${trackWidthVar})`,
        '--switch-thumb-width': `var(${thumbWidthVar})`,
        '--switch-thumb-height': `var(${thumbHeightVar})`,
        '--switch-thumb-border-radius': `var(${thumbBorderRadiusVar})`,
        '--switch-track-border-radius': `var(${trackBorderRadiusVar})`,
        '--switch-track-inner-padding': `var(${trackInnerPaddingVar})`,
        '--recursica-switch-thumb-icon-size': `var(${thumbIconSizeVar})`,
        width: `var(${trackWidthVar})`,
        position: 'relative',
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
      <div 
        className="recursica-carbon-toggle-icon-overlay" 
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: checked ? 'auto' : `var(${trackInnerPaddingVar})`,
          right: checked ? `var(${trackInnerPaddingVar})` : 'auto',
          width: `var(${thumbWidthVar})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {checked ? (ThumbIconSelected ? <ThumbIconSelected style={{ width: `var(${thumbIconSizeVar})`, height: `var(${thumbIconSizeVar})`, color: `var(${trackSelectedVar})` }} /> : null) : (ThumbIconUnselected ? <ThumbIconUnselected style={{ width: `var(${thumbIconSizeVar})`, height: `var(${thumbIconSizeVar})`, color: `var(${trackUnselectedVar})` }} /> : null)}
      </div>
    </div>
  )
}

