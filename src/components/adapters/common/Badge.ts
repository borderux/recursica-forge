/**
 * Badge — common types
 *
 * Single source of truth for the Badge prop vocabulary, shared by the dispatcher
 * (`adapters/Badge.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Badge`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type BadgeProps = {
  children?: React.ReactNode
  variant?: string
  size?: 'small' | 'large'
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
