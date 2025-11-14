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
      // Use CSS variables for theming
      backgroundColor: variant === 'solid' 
        ? 'var(--recursica-ui-kit-components-button-color-layer-0-background-solid)'
        : 'transparent',
      color: variant === 'solid'
        ? 'var(--recursica-ui-kit-components-button-color-layer-0-text-solid)'
        : 'var(--recursica-ui-kit-components-button-color-layer-0-outline)',
      borderColor: variant === 'outline'
        ? 'var(--recursica-ui-kit-components-button-color-layer-0-outline)'
        : undefined,
      ...style,
      ...material?.sx,
    },
    ...material,
    ...props,
  }
  
  return <MaterialButton {...materialProps}>{children}</MaterialButton>
}

