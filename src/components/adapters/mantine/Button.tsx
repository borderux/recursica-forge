/**
 * Mantine Button Implementation
 * 
 * Mantine-specific Button component that uses CSS variables for theming.
 */

import { Button as MantineButton } from '@mantine/core'
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
  mantine,
  ...props
}: AdapterButtonProps) {
  // Map unified variant to Mantine variant
  const mantineVariant = variant === 'solid' ? 'filled' : variant === 'outline' ? 'outline' : 'subtle'
  
  // Map unified size to Mantine size
  const mantineSize = size === 'small' ? 'xs' : size === 'default' ? 'md' : 'lg'
  
  // Merge library-specific props
  const mantineProps = {
    variant: mantineVariant,
    size: mantineSize,
    disabled,
    onClick,
    type,
    className,
    style: {
      // Use CSS variables for theming
      '--button-bg': 'var(--recursica-ui-kit-components-button-color-layer-0-background-solid)',
      '--button-color': 'var(--recursica-ui-kit-components-button-color-layer-0-text-solid)',
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  return <MantineButton {...mantineProps}>{children}</MantineButton>
}

