/**
 * Material UI Switch Implementation
 * 
 * Material UI-specific Switch component that uses CSS variables for theming.
 */

import { Switch as MaterialSwitch } from '@mui/material'
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
  material,
  ...props
}: AdapterSwitchProps) {
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
        },
        ...style,
      }}
      {...material}
      {...props}
    />
  )
}

