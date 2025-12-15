/**
 * Material UI Switch Implementation
 * 
 * Material UI-specific Switch component that uses CSS variables for theming.
 */

import { Switch as MaterialSwitch } from '@mui/material'
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
  material,
  ...props
}: AdapterSwitchProps) {
  const { mode } = useThemeMode()
  
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
  
  return (
    <MaterialSwitch
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={className}
      sx={{
        '& .MuiSwitch-switchBase': {
          '& .MuiSwitch-thumb': {
            backgroundColor: `${thumbColor} !important`,
            opacity: '1 !important',
          },
          '&.Mui-checked': {
            '& + .MuiSwitch-track': {
              backgroundColor: `${trackSelectedColor} !important`,
              opacity: '1 !important',
            },
            '& .MuiSwitch-thumb': {
              backgroundColor: `${thumbColor} !important`,
              opacity: '1 !important',
            },
          },
        },
        '& .MuiSwitch-track': {
          backgroundColor: `${trackUnselectedColor} !important`,
          opacity: '1 !important',
          borderRadius: `var(${borderRadiusVar}, 999px)`,
          ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        },
        ...style,
      }}
      {...material}
      {...props}
    />
  )
}

