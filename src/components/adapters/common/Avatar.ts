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
  /**
   * `colorVariant`/`sizeVariant` are Forge's own narrow, coarse-grained scales, confirmed
   * correct as-is — deliberately narrower than raw Mantine's own `variant`/`size` (each kit's
   * wrapper maps these values onto the real component's own scale internally). Not intended
   * to widen to expose every native value.
   */
  colorVariant?: 'text' | 'text-solid' | 'text-ghost' | 'icon' | 'icon-solid' | 'icon-ghost' | 'image'
  sizeVariant?: 'small' | 'default' | 'large'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  /**
   * Removed (2026-08): corner radius is token-driven, not a runtime prop, on every kit —
   * confirmed even Material and Carbon (which used to branch on this) now always resolve
   * border-radius from the CSS var. Raw `@mantine/core`'s Avatar does have a real `radius`
   * prop, and raw MUI's Avatar has a real `variant: 'circular'|'rounded'|'square'`, but the
   * real Mantine adapter has never exposed either, and this brings the other two kits in line
   * with that rather than the reverse.
   */
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
