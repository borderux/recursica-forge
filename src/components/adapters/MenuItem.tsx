/**
 * MenuItem Component Adapter
 * 
 * Unified MenuItem component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { MenuItemProps } from './common/MenuItem'

// Re-exported so existing `import type { MenuItemProps } from '.../adapters/MenuItem'`
// call sites keep working — the types now live in common/MenuItem.ts.
export type { MenuItemProps } from './common/MenuItem'

export function MenuItem({
  children,
  variant = 'default',
  layer = 'layer-0',
  leadingIcon,
  leadingIconType = 'none',
  trailingIcon,
  supportingText,
  selected = false,
  selectionState,
  divider,
  dividerColor,
  dividerOpacity,
  disabled = false,
  onClick,
  className,
  style,
  mantine,
  material,
  carbon,
}: MenuItemProps) {
  const Component = useComponent('MenuItem')

  // Determine effective variant based on props
  let effectiveVariant = variant
  if (disabled) {
    effectiveVariant = 'disabled'
  } else if (selected) {
    effectiveVariant = 'selected'
  }

  // Map unified props to library-specific props
  const libraryProps = {
    variant: effectiveVariant,
    layer,
    leadingIcon,
    leadingIconType,
    trailingIcon,
    supportingText,
    selected,
    selectionState,
    divider,
    dividerColor,
    dividerOpacity,
    disabled,
    onClick,
    className,
    style,
    mantine,
    material,
    carbon,
  }

  return (
    <Suspense fallback={<span />}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

