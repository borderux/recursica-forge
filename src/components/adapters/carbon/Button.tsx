/**
 * Carbon Button Implementation
 * 
 * Carbon-specific Button component that uses CSS variables for theming.
 */

import { Button as CarbonButton } from '@carbon/react'
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
  carbon,
  ...props
}: AdapterButtonProps) {
  // Map unified variant to Carbon kind
  const carbonKind = variant === 'solid' ? 'primary' : variant === 'outline' ? 'secondary' : 'tertiary'
  
  // Map unified size to Carbon size
  const carbonSize = size === 'small' ? 'sm' : 'md'
  
  // Merge library-specific props
  const carbonProps = {
    kind: carbonKind,
    size: carbonSize,
    disabled,
    onClick,
    type,
    className,
    style: {
      // Use CSS variables for theming - new structure: color.layer-0.{variant}.{property}
      '--cds-button-primary': `var(--recursica-ui-kit-components-button-color-layer-0-${variant === 'solid' ? 'solid' : variant === 'outline' ? 'outline' : 'text'}-background)`,
      '--cds-button-text-primary': `var(--recursica-ui-kit-components-button-color-layer-0-${variant === 'solid' ? 'solid' : variant === 'outline' ? 'outline' : 'text'}-text)`,
      ...style,
    },
    ...carbon,
    ...props,
  }
  
  return <CarbonButton {...carbonProps}>{children}</CarbonButton>
}

