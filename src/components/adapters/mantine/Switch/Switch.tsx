/**
 * Mantine Switch Implementation
 * 
 * Mantine-specific Switch component that uses CSS variables for theming.
 */

import { useState, useEffect } from 'react'
import { Switch as MantineSwitch } from '@mantine/core'
import type { SwitchProps as AdapterSwitchProps } from '../../Switch'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Switch.css'

// Initialize Switch wrapper CSS variables on :root so they're always available
// These are used by Switch.css even when no Switch component is rendered
if (typeof window !== 'undefined') {
  const root = document.documentElement
  // Initialize with default values - will be overridden by component instances
  // Use UIKit variable references for track colors (default layer-0, default variant)
  const trackSelectedVar = getComponentCssVar('Switch', 'colors', 'default-track-selected', 'layer-0')
  const trackUnselectedVar = getComponentCssVar('Switch', 'colors', 'default-track-unselected', 'layer-0')
  
  if (!root.style.getPropertyValue('--recursica-ui-kit-components-switch-thumb-elevation')) {
    root.style.setProperty('--recursica-ui-kit-components-switch-thumb-elevation', 'none')
  }
  if (!root.style.getPropertyValue('--recursica-ui-kit-components-switch-track-elevation')) {
    root.style.setProperty('--recursica-ui-kit-components-switch-track-elevation', 'none')
  }
  if (!root.style.getPropertyValue('--recursica-ui-kit-components-switch-track-checked')) {
    root.style.setProperty('--recursica-ui-kit-components-switch-track-checked', `var(${trackSelectedVar})`)
  }
  if (!root.style.getPropertyValue('--recursica-ui-kit-components-switch-track-unchecked')) {
    root.style.setProperty('--recursica-ui-kit-components-switch-track-unchecked', `var(${trackUnselectedVar})`)
  }
}

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
  mantine,
  ...props
}: AdapterSwitchProps) {
  const { mode } = useThemeMode()
  
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
  
  // Read resolved values for Mantine internal variables to avoid undefined references
  const thumbBorderRadiusValue = readCssVarResolved(thumbBorderRadiusVar) || readCssVar(thumbBorderRadiusVar) || '0px'
  
  return (
    <MantineSwitch
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      disabled={disabled}
      thumbIcon={checked ? (ThumbIconSelected ? <ThumbIconSelected style={{ width: `var(${thumbIconSizeVar})`, height: `var(${thumbIconSizeVar})` }} /> : null) : (ThumbIconUnselected ? <ThumbIconUnselected style={{ width: `var(${thumbIconSizeVar})`, height: `var(${thumbIconSizeVar})` }} /> : null)}
      className={className}
      style={{
        // Set Mantine's internal CSS variables to reference UIKit variables directly
        // These will automatically update when UIKit variables change
        '--switch-thumb-size': `var(${thumbWidthVar})`,
        '--switch-width': `var(${trackWidthVar})`,
        '--switch-track-label-padding': `var(${trackInnerPaddingVar})`,
        '--switch-radius': thumbBorderRadiusValue,
        // Set wrapper variables that CSS will use - these reference UIKit vars directly
        '--recursica-ui-kit-components-switch-thumb-bg-selected': `var(${thumbSelectedVar})`,
        '--recursica-ui-kit-components-switch-thumb-bg-unselected': `var(${thumbUnselectedVar})`,
        '--recursica-ui-kit-components-switch-track-checked': `var(${trackSelectedVar})`,
        '--recursica-ui-kit-components-switch-track-unchecked': `var(${trackUnselectedVar})`,
        '--recursica-ui-kit-components-switch-track-height': trackHeight, // Calculated: thumb-height + 2 * track-inner-padding
        '--recursica-ui-kit-components-switch-thumb-elevation': thumbElevationBoxShadow || 'none',
        '--recursica-ui-kit-components-switch-track-elevation': trackElevationBoxShadow || 'none',
        width: `var(${trackWidthVar})`,
        ...style,
      }}
      {...mantine}
      {...props}
    />
  )
}

