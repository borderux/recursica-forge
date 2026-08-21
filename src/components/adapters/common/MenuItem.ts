/**
 * MenuItem — common types
 *
 * Single source of truth for the MenuItem prop vocabulary, shared by the dispatcher
 * (`adapters/MenuItem.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/MenuItem`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type MenuItemProps = {
  children?: React.ReactNode
  variant?: 'default' | 'hover' | 'selected' | 'focused' | 'disabled'
  layer?: ComponentLayer
  leadingIcon?: React.ReactNode
  leadingIconType?: 'radio' | 'checkbox' | 'icon' | 'none'
  trailingIcon?: React.ReactNode
  supportingText?: string
  selected?: boolean
  /** Custom selection-state name (from the toolbar). Built-ins are `selected`/`unselected`;
   *  any other value renders in the selected/active visual with that state's colours. */
  selectionState?: string
  divider?: 'none' | 'bottom'
  dividerColor?: string
  dividerOpacity?: number
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
