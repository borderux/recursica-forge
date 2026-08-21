/**
 * Label — common types
 *
 * Single source of truth for the Label prop vocabulary, shared by the dispatcher
 * (`adapters/Label.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Label`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type LabelProps = {
  children?: React.ReactNode
  htmlFor?: string
  variant?: 'default' | 'required' | 'optional'
  size?: 'default' | 'small'
  layout?: string  // accepts custom layout variant names
  align?: 'left' | 'right'
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
  required?: boolean
  id?: string
  editIcon?: React.ReactNode | boolean
  editIconGap?: string | number
  onEditIconClick?: (e: React.MouseEvent) => void
  editIconTitle?: string
} & LibrarySpecificProps
