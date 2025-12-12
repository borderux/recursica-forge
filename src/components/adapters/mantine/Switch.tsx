/**
 * Mantine Switch Implementation
 * 
 * Mantine-specific Switch component that uses CSS variables for theming.
 */

import { Switch as MantineSwitch } from '@mantine/core'
import type { SwitchProps as AdapterSwitchProps } from '../Switch'
import { toCssVarName } from '../../utils/cssVarNames'
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
  mantine,
  ...props
}: AdapterSwitchProps) {
  // Build UIKit CSS var names - these already include the layer in the path
  // e.g., --recursica-ui-kit-components-switch-color-layer-0-variant-default-thumb
  const thumbVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'thumb'].join('.'))
  const trackSelectedVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-selected'].join('.'))
  const trackUnselectedVar = toCssVarName(['components', 'switch', 'color', layer, 'variant', colorVariant, 'track-unselected'].join('.'))
  const borderRadiusVar = toCssVarName(['components', 'switch', 'size', 'variant', sizeVariant, 'border-radius'].join('.'))
  
  return (
    <MantineSwitch
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      disabled={disabled}
      thumbIcon={null}
      className={className}
      style={{
        '--switch-thumb-bg': `var(${thumbVar})`,
        '--switch-track-checked': `var(${trackSelectedVar})`,
        '--switch-track-unchecked': `var(${trackUnselectedVar})`,
        '--switch-border-radius': `var(${borderRadiusVar})`,
        ...style,
      }}
      {...mantine}
      {...props}
    />
  )
}

