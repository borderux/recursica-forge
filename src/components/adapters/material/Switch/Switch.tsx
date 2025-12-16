/**
 * Material UI Switch Implementation
 * 
 * Material UI-specific Switch component that uses CSS variables for theming.
 */

import { Switch as MaterialSwitch } from '@mui/material'
import { useEffect, useState } from 'react'
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
  material,
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
      if (updatedVars.some((v: string) => v === thumbHeightVar || v === thumbWidthVar || v === thumbBorderRadiusVar || v === thumbIconSizeVar)) {
        setUpdateCounter(prev => prev + 1)
      }
    }
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
  }, [thumbHeightVar, thumbWidthVar, thumbBorderRadiusVar, thumbIconSizeVar])
  
  // Override track-selected to use alternative layer's interactive color when alt layer is set
  if (hasComponentAlternativeLayer) {
    trackSelectedVar = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property-element-interactive-tone`
  }
  
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
  const trackHeight = `calc(var(${thumbHeightVar}, 20px) + 2 * var(${trackInnerPaddingVar}, 8px))`
  
  // Use updateCounter to force re-render when CSS vars change (even though we don't use it in render)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = updateCounter
  
  return (
    <MaterialSwitch
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={className}
      icon={ThumbIconUnselected ? <ThumbIconUnselected style={{ width: `var(${thumbIconSizeVar}, 12px)`, height: `var(${thumbIconSizeVar}, 12px)` }} /> : undefined}
      checkedIcon={ThumbIconSelected ? <ThumbIconSelected style={{ width: `var(${thumbIconSizeVar}, 12px)`, height: `var(${thumbIconSizeVar}, 12px)` }} /> : undefined}
      sx={{
        width: `var(${trackWidthVar}, 48px)`,
        '& .MuiSwitch-switchBase': {
          // Position switchBase relative to track's content area (respecting padding)
          left: `var(${trackInnerPaddingVar}, 8px) !important`,
          right: 'auto !important',
          // Unchecked: thumb at left edge of content area (already at padding position)
          transform: 'translateX(0) !important',
          '& .MuiSwitch-thumb': {
            backgroundColor: `${thumbUnselectedColor} !important`,
            opacity: '1 !important',
            width: `var(${thumbWidthVar}, 20px)`,
            height: `var(${thumbHeightVar}, 20px)`,
            borderRadius: `var(${thumbBorderRadiusVar}, 999px)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...(thumbElevationBoxShadow ? { boxShadow: thumbElevationBoxShadow } : {}),
            '& > *': {
              width: `var(${thumbIconSizeVar}, 12px)`,
              height: `var(${thumbIconSizeVar}, 12px)`,
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
            right: `var(${trackInnerPaddingVar}, 8px) !important`,
            transform: 'translateX(0) !important',
          },
        },
        '& .MuiSwitch-track': {
          backgroundColor: `${trackUnselectedColor} !important`,
          opacity: '1 !important',
          borderRadius: `var(${trackBorderRadiusVar}, 999px)`,
          width: `var(${trackWidthVar}, 48px)`,
          height: trackHeight,
          padding: `var(${trackInnerPaddingVar}, 8px)`,
          ...(trackElevationBoxShadow ? { boxShadow: trackElevationBoxShadow } : {}),
        },
        ...style,
      }}
      {...material}
      {...props}
    />
  )
}

