/**
 * MenuItem Component Adapter
 * 
 * Unified MenuItem component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { MenuItemProps } from './common/MenuItem'
import { isLocalAdapter } from '../registry/activeAdapter'
import { MenuItem as LocalMenuItem } from './local/dispatch/MenuItem'

// Re-exported so existing `import type { MenuItemProps } from '.../adapters/MenuItem'`
// call sites keep working — the types now live in common/MenuItem.ts.
export type { MenuItemProps } from './common/MenuItem'

function SharedMenuItem({
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

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const MenuItem = (isLocalAdapter ? LocalMenuItem : SharedMenuItem) as typeof SharedMenuItem
