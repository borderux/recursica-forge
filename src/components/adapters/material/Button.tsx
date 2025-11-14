/**
 * Material UI Button Implementation
 * 
 * Material UI-specific Button component that uses CSS variables for theming.
 */

import { Button as MaterialButton } from '@mui/material'
import type { ButtonProps as AdapterButtonProps } from '../../Button'

export default function Button({
  children,
  variant = 'solid',
  size = 'default',
  disabled,
  onClick,
  type,
  className,
  style,
  material,
  ...props
}: AdapterButtonProps) {
  // Map unified variant to Material variant
  const materialVariant = variant === 'solid' ? 'contained' : variant === 'outline' ? 'outlined' : 'text'
  
  // Map unified size to Material size
  const materialSize = size === 'small' ? 'small' : 'medium'
  
  // Merge library-specific props
  const materialProps = {
    variant: materialVariant,
    size: materialSize,
    disabled,
    onClick,
    type,
    className,
    sx: {
      // Use CSS variables for theming - new structure: color.layer-0.{variant}.{property}
      backgroundColor: variant === 'solid'
        ? 'var(--recursica-ui-kit-components-button-color-layer-0-solid-background)'
        : variant === 'outline'
        ? 'var(--recursica-ui-kit-components-button-color-layer-0-outline-background)'
        : 'var(--recursica-ui-kit-components-button-color-layer-0-text-background)',
      color: variant === 'solid'
        ? 'var(--recursica-ui-kit-components-button-color-layer-0-solid-text)'
        : variant === 'outline'
        ? 'var(--recursica-ui-kit-components-button-color-layer-0-outline-text)'
        : 'var(--recursica-ui-kit-components-button-color-layer-0-text-text)',
      borderColor: variant === 'outline'
        ? 'var(--recursica-ui-kit-components-button-color-layer-0-outline-text)'
        : undefined,
      fontSize: 'var(--recursica-ui-kit-components-button-size-font-size)',
      ...style,
      ...material?.sx,
    },
    ...material,
    ...props,
  }
  
  return <MaterialButton {...materialProps}>{children}</MaterialButton>
}

