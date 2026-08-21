/**
 * Avatar — common types
 *
 * Single source of truth for the Avatar prop vocabulary, shared by the dispatcher
 * (`adapters/Avatar.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Avatar`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type AvatarProps = {
  src?: string
  alt?: string
  fallback?: React.ReactNode // e.g., initials or icon
  colorVariant?: 'text' | 'text-solid' | 'text-ghost' | 'icon' | 'icon-solid' | 'icon-ghost' | 'image'
  sizeVariant?: 'small' | 'default' | 'large'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  shape?: 'circle' | 'square'
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
