/**
 * Material UI Switch Implementation
 * 
 * Material UI-specific Switch component that uses CSS variables for theming.
 */

import { useState, useEffect } from 'react'
import { Switch as MaterialSwitch } from '@mui/material'
import type { SwitchProps as AdapterSwitchProps } from '../../Switch'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Switch.css'

// Initialize Switch wrapper CSS variables on :root so they're always available
// These are used by Switch.css even when no Switch component is rendered
// Note: These are initialized without mode prefix - they'll be updated by component instances
// with mode-specific values when components mount
if (typeof window !== 'undefined') {
  const root = document.documentElement
  // Initialize with default values - will be overridden by component instances
  // Use UIKit variable references for track colors (default layer-0)
  // Note: getComponentCssVar now includes mode automatically, but at module load time
  // we don't know the mode yet, so we'll use the mode-specific vars that will be set
  // by the component instances
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
  material,
  ...props
}: AdapterSwitchProps) {
  const { mode } = useThemeMode()
  const [updateKey, setUpdateKey] = useState(0)
  
  // Force re-render when mode changes to update CSS variable references
  useEffect(() => {
    setUpdateKey(prev => prev + 1)
  }, [mode])
  
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
  
  
  return (
    <MaterialSwitch
      key={`switch-${mode}-${updateKey}`}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={className}
      icon={ThumbIconUnselected ? <ThumbIconUnselected style={{ width: `var(${thumbIconSizeVar})`, height: `var(${thumbIconSizeVar})` }} /> : undefined}
      checkedIcon={ThumbIconSelected ? <ThumbIconSelected style={{ width: `var(${thumbIconSizeVar})`, height: `var(${thumbIconSizeVar})` }} /> : undefined}
      sx={{
        width: `var(${trackWidthVar})`,
        '& .MuiSwitch-switchBase': {
          // Position switchBase relative to track's content area (respecting padding)
          left: `var(${trackInnerPaddingVar}) !important`,
          right: 'auto !important',
          // Unchecked: thumb at left edge of content area (already at padding position)
          transform: 'translateX(0) !important',
          '& .MuiSwitch-thumb': {
            backgroundColor: `${thumbUnselectedColor} !important`,
            opacity: '1 !important',
            width: `var(${thumbWidthVar})`,
            height: `var(${thumbHeightVar})`,
            borderRadius: `var(${thumbBorderRadiusVar})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...(thumbElevationBoxShadow ? { boxShadow: thumbElevationBoxShadow } : {}),
            '& > *': {
              width: `var(${thumbIconSizeVar})`,
              height: `var(${thumbIconSizeVar})`,
            },
          },
          '&.Mui-checked': {
            '& + .MuiSwitch-track': {
              backgroundColor: `${trackSelectedColor} !important`,
              opacity: '1 !important',
            },
            '& .MuiSwitch-thumb': {
              backgroundColor: `${thumbSelectedColor} !important`,
              opacity: '1 !important',
            },
            // Right-align the thumb when checked: use right positioning instead of transform
            left: 'auto !important',
            right: `var(${trackInnerPaddingVar}) !important`,
            transform: 'translateX(0) !important',
          },
        },
        '& .MuiSwitch-track': {
          backgroundColor: `${trackUnselectedColor} !important`,
          opacity: '1 !important',
          borderRadius: `var(${trackBorderRadiusVar})`,
          width: `var(${trackWidthVar})`,
          height: trackHeight,
          padding: `var(${trackInnerPaddingVar})`,
          ...(trackElevationBoxShadow ? { boxShadow: trackElevationBoxShadow } : {}),
        },
        ...style,
      }}
      {...(() => {
        // Filter out sizeVariant from material prop as it's not a valid Material UI Switch prop
        if (material && typeof material === 'object') {
          const { sizeVariant: _materialSizeVariant, ...materialWithoutSizeVariant } = material as any
          return materialWithoutSizeVariant
        }
        return {}
      })()}
      {...(() => {
        // Filter out sizeVariant from props as it's not a valid Material UI Switch prop
        const { sizeVariant: _propsSizeVariant, ...propsWithoutSizeVariant } = props as any
        return propsWithoutSizeVariant
      })()}
    />
  )
}

